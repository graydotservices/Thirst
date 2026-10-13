import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const ids = {
  admin: '10000000-0000-0000-0000-000000000001', manager: '10000000-0000-0000-0000-000000000002',
  cashier: '10000000-0000-0000-0000-000000000003', outsider: '10000000-0000-0000-0000-000000000004',
  inactive: '10000000-0000-0000-0000-000000000005', product: '20000000-0000-0000-0000-000000000001',
};

async function database() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE TABLE auth.users (id UUID PRIMARY KEY, email TEXT, email_confirmed_at TIMESTAMPTZ, banned_until TIMESTAMPTZ);
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::UUID $$;
    CREATE FUNCTION public.uuid_generate_v4() RETURNS UUID LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
    CREATE TABLE storage.buckets (id TEXT PRIMARY KEY,name TEXT,public BOOLEAN,file_size_limit BIGINT,allowed_mime_types TEXT[]);
    CREATE TABLE storage.objects (id UUID DEFAULT gen_random_uuid(),bucket_id TEXT,name TEXT);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.extension(name TEXT) RETURNS TEXT LANGUAGE sql AS $$ SELECT reverse(split_part(reverse(name),'.',1)) $$;
    GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated,service_role;
    GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO anon,authenticated,service_role;
    GRANT EXECUTE ON FUNCTION auth.uid(), storage.extension(TEXT) TO anon,authenticated,service_role;
  `);
  const schema = readFileSync(new URL('../supabase/schema.sql', import.meta.url),'utf8')
    .replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";','');
  await db.exec(schema);
  for (const [role,id] of Object.entries(ids).filter(([role])=>role !== 'product')) {
    await db.query('INSERT INTO auth.users(id,email,email_confirmed_at) VALUES ($1,$2,now())',[id,`${role}@test.invalid`]);
    if (role !== 'outsider') await db.query('INSERT INTO public.staff(id,auth_user_id,name,email,role,status) VALUES ($1,$1,$2,$3,$4,$5)',
      [id,role,`${role}@test.invalid`,role === 'inactive'?'cashier':role,role === 'inactive'?'inactive':'active']);
  }
  await db.query('INSERT INTO public.products(id,name,category,price,stock) VALUES ($1,$2,$3,100,5)',[ids.product,'Test cake','cakes']);
  return db;
}

async function as(db, role, user, action) {
  await db.exec(`SET ROLE ${role}`);
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[user || '']);
  try { return await action(); } finally { await db.exec('RESET ROLE'); }
}

const checkout = (db, request, qty=1, extra={}) => db.query(
  'SELECT public.place_order_atomic($1::jsonb,$2,$3,$4,$5,$6) AS sale',
  [JSON.stringify([{product_id:ids.product,qty,price:100,...extra}]),'Customer','9876543210',0,'cash',request]);

test('analytics return complete small summaries beyond 1,000 rows with IST boundaries and live role checks', async () => {
  const db = await database();
  try {
    await db.exec(`
      INSERT INTO public.orders(customer_name,customer_phone,items,subtotal,total,payment_method,bill_no,created_at)
      SELECT 'Customer','9'||lpad(n::TEXT,9,'0'),
        '[{"name":"Cake","qty":1,"total":100,"price":100},{"product_id":"meta_staff","name":"Billed by: Admin","qty":1,"total":999}]'::JSONB,
        100,100,'cash','TEST-'||n,((now() AT TIME ZONE 'Asia/Kolkata')::DATE::TIMESTAMP + interval '1 minute') AT TIME ZONE 'Asia/Kolkata'
      FROM generate_series(1,1505) n;
      INSERT INTO public.orders(customer_name,customer_phone,items,subtotal,total,payment_method,bill_no,created_at,status) VALUES
        ('Yesterday','9876543210','[]',50,50,'cash','BEFORE-MIDNIGHT',((now() AT TIME ZONE 'Asia/Kolkata')::DATE::TIMESTAMP AT TIME ZONE 'Asia/Kolkata')-interval '1 second','completed'),
        ('Cancelled','9876543210','[]',50,50,'cash','CANCELLED',now(),'cancelled'),
        ('Future','9876543210','[]',50,50,'cash','FUTURE',now()+interval '2 days','completed'),
        ('Old','9876543210','[]',50,50,'cash','OLD',date_trunc('year',now())-interval '3 years','completed');
      INSERT INTO public.customers(name,phone,loyalty_points,total_purchase) VALUES ('A','9876543210',10,100),('B','9876543211',20,200);
    `);
    await as(db,'authenticated',ids.manager,async () => {
      for (const range of ['daily','weekly','monthly','yearly']) {
        const summary = (await db.query('SELECT public.sales_summary($1) AS summary',[range])).rows[0].summary;
        assert.equal(summary.totalOrders, range === 'daily' ? 1505 : (range === 'weekly' || range === 'yearly' ? 1506 :
          (await db.query("SELECT count(*)::int AS n FROM public.orders WHERE status='completed' AND created_at >= date_trunc('year',now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata' AND created_at < ((now() AT TIME ZONE 'Asia/Kolkata')::DATE+1)::TIMESTAMP AT TIME ZONE 'Asia/Kolkata'")).rows[0].n));
        assert.equal(summary.chartData.length, {daily:24,weekly:7,monthly:12,yearly:3}[range]);
        assert.equal(summary.chartData.reduce((sum,row)=>sum+row.revenue,0),summary.totalRevenue);
        assert.equal(summary.topProducts.length,1);
        assert.equal(summary.topProducts[0].revenue,150500);
        assert.equal(summary.topProducts[0].orders,1505);
        assert(new Date(summary.periodStart) < new Date(summary.periodEnd));
        assert(JSON.stringify(summary).length < 6000);
      }
      const dashboard = (await db.query('SELECT public.dashboard_summary() AS summary')).rows[0].summary;
      assert.equal(dashboard.stats.todayOrders,1505);
      assert.equal(dashboard.stats.todayRevenue,150500);
      assert.equal(dashboard.stats.activeCustomers,2);
      assert.equal(dashboard.chartData.length,7);
      assert.equal(dashboard.recentBills.length,5);
      assert.deepEqual((await db.query('SELECT public.customer_summary() AS summary')).rows[0].summary,{count:2,loyaltyPoints:30,revenue:300});
      await assert.rejects(db.query("SELECT public.sales_summary('all-time')"),/Invalid range/);
    });
    for (const [role,user] of [['anon',null],['authenticated',ids.cashier],['authenticated',ids.outsider],['authenticated',ids.inactive]]) {
      await as(db,role,user,async () => {
        for (const fn of ['sales_summary','dashboard_summary','customer_summary']) await assert.rejects(db.query(`SELECT public.${fn}()`));
      });
    }
    await db.query("UPDATE public.staff SET status='inactive' WHERE id=$1",[ids.manager]);
    await as(db,'authenticated',ids.manager,async()=>{await assert.rejects(db.query('SELECT public.dashboard_summary()'),/Management access required/);});
    // Existing projects can apply the performance migration repeatedly after security.
    await db.exec(readFileSync(new URL('../supabase/migrations/20261013_performance.sql',import.meta.url),'utf8'));
  } finally { await db.close(); }
});

test('fresh schema installs and anonymous/non-staff/inactive users cannot access private data or checkout', async () => {
  const db=await database();
  try {
    await as(db,'anon',null,async()=>{
      for (const table of ['staff','orders','customers','franchise_applications']) await assert.rejects(db.query(`SELECT * FROM public.${table}`));
      await assert.rejects(db.query("UPDATE public.company_settings SET phone='9876543210'"));
      await assert.rejects(checkout(db,'30000000-0000-0000-0000-000000000001'));
      await assert.rejects(db.query("INSERT INTO public.franchise_applications(name,phone,email,city,budget) VALUES ('x','9876543210','x@y.z','x','x')"));
      assert.equal((await db.query('SELECT id FROM public.company_settings')).rows.length,1);
    });
    for(const user of [ids.outsider,ids.inactive]) await as(db,'authenticated',user,async()=>{
      for(const table of ['orders','customers','franchise_applications']) assert.equal((await db.query(`SELECT * FROM public.${table}`)).rows.length,0);
      await assert.rejects(checkout(db,'30000000-0000-0000-0000-000000000002'));
      await assert.rejects(db.query('SELECT * FROM public.billing_customers()'));
    });
  } finally { await db.close(); }
});

test('cashiers cannot elevate roles, alter stock/spend/settings, view full CRM, cancel, or upload', async()=>{
  const db=await database();
  try {
    await as(db,'authenticated',ids.cashier,async()=>{
      await assert.rejects(db.query("UPDATE public.staff SET role='admin' WHERE auth_user_id=auth.uid()"));
      await assert.rejects(db.query("UPDATE public.customers SET loyalty_points=999999"));
      const stock=await db.query('UPDATE public.products SET stock=999 WHERE id=$1 RETURNING id',[ids.product]);
      assert.equal(stock.rows.length,0);
      assert.equal((await db.query("UPDATE public.company_settings SET name='Changed' RETURNING id")).rows.length,0);
      assert.equal((await db.query('SELECT * FROM public.staff')).rows.length,1);
      assert.equal((await db.query('SELECT * FROM public.customers')).rows.length,0);
      await assert.rejects(db.query("INSERT INTO storage.objects(bucket_id,name) VALUES ('product-images','test.png')"));
      await assert.rejects(db.query('SELECT public.cancel_order_atomic($1)', ['40000000-0000-0000-0000-000000000001']));
    });
    assert.equal((await db.query('SELECT stock FROM public.products WHERE id=$1',[ids.product])).rows[0].stock,5);
  } finally { await db.close(); }
});

test('checkout calculates authoritative prices, commits once per key and rolls back stock failures', async()=>{
  const db=await database();
  try {
    let sale;
    await as(db,'authenticated',ids.cashier,async()=>{
      sale=(await checkout(db,'30000000-0000-0000-0000-000000000003',2)).rows[0].sale;
      assert.equal(sale.total,200); assert.equal(sale.staff_id,ids.cashier);
      assert.equal(sale.items[0].name,'Test cake'); assert.match(sale.bill_no,/^TH-\d{8}-\d{8}$/);
      const retry=(await checkout(db,'30000000-0000-0000-0000-000000000003',2)).rows[0].sale;
      assert.equal(retry.id,sale.id);
      await assert.rejects(checkout(db,'30000000-0000-0000-0000-000000000004',4),/stock/);
      await assert.rejects(checkout(db,'30000000-0000-0000-0000-000000000005',1,{price:1}),/price changed/);
      const customers=(await db.query('SELECT * FROM public.billing_customers()')).rows;
      assert.equal(customers.length,1); assert.equal(customers[0].loyalty_points,2);
      assert.equal('email' in customers[0],false);
      await assert.rejects(db.query("INSERT INTO public.orders(customer_name) VALUES ('forged')"));
    });
    assert.equal((await db.query('SELECT stock FROM public.products WHERE id=$1',[ids.product])).rows[0].stock,3);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.orders')).rows[0].n,1);
    await as(db,'authenticated',ids.manager,async()=>{
      await assert.rejects(checkout(db,'30000000-0000-0000-0000-000000000003',2),/another staff/);
      await db.query('SELECT public.cancel_order_atomic($1)',[sale.id]);
      await db.query('SELECT public.cancel_order_atomic($1)',[sale.id]);
    });
    assert.equal((await db.query('SELECT stock FROM public.products WHERE id=$1',[ids.product])).rows[0].stock,5);
    const customer=(await db.query('SELECT loyalty_points,total_purchase FROM public.customers')).rows[0];
    assert.equal(customer.loyalty_points,0); assert.equal(Number(customer.total_purchase),0);
  } finally { await db.close(); }
});

test('managers cannot manage staff/company identity and active-status revocation takes effect immediately', async()=>{
  const db=await database();
  try {
    await as(db,'authenticated',ids.manager,async()=>{
      assert.equal((await db.query("UPDATE public.company_settings SET name='Changed' RETURNING id")).rows.length,0);
      await assert.rejects(db.query("UPDATE public.staff SET status='inactive'"));
      await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES ('product-images','test.webp')");
      await assert.rejects(db.query("INSERT INTO storage.objects(bucket_id,name) VALUES ('product-images','test.svg')"));
    });
    await db.query("UPDATE public.staff SET status='inactive' WHERE id=$1",[ids.cashier]);
    await as(db,'authenticated',ids.cashier,async()=>{
      await assert.rejects(checkout(db,'30000000-0000-0000-0000-000000000006'));
    });
    await assert.rejects(db.query("UPDATE public.staff SET role='cashier' WHERE id=$1",[ids.admin]),/last active/);
  } finally { await db.close(); }
});

test('rate limits persist and do not change staff sessions', async()=>{
  const db=await database();
  try {
    await as(db,'authenticated',ids.cashier,async()=>{
      for(let i=0;i<60;i++) assert.equal((await db.query("SELECT public.consume_api_rate_limit('write') AS allowed")).rows[0].allowed,true);
      assert.equal((await db.query("SELECT public.consume_api_rate_limit('write') AS allowed")).rows[0].allowed,false);
      assert.equal((await db.query('SELECT public.current_staff_role() AS role')).rows[0].role,'cashier');
    });
  } finally { await db.close(); }
});

test('upgrade removes legacy permissive policies, links verified staff and can be applied again', async()=>{
  const db=await database();
  try {
    await db.exec(`CREATE POLICY old_admin_everyone ON public.staff FOR ALL TO authenticated USING(true);
      CREATE POLICY old_company_everyone ON public.company_settings FOR ALL USING(true);
      CREATE POLICY old_storage_everyone ON storage.objects FOR ALL TO anon,authenticated USING(true) WITH CHECK(true);`);
    await db.query('UPDATE public.staff SET auth_user_id=NULL WHERE id=$1',[ids.cashier]);
    const migration=readFileSync(new URL('../supabase/migrations/20261013_production_security.sql',import.meta.url),'utf8');
    await db.exec(migration);
    assert.equal((await db.query('SELECT auth_user_id FROM public.staff WHERE id=$1',[ids.cashier])).rows[0].auth_user_id,ids.cashier);
    await as(db,'anon',null,()=>assert.rejects(db.query("UPDATE public.company_settings SET name='Unauthorized'")));
    await as(db,'authenticated',ids.cashier,()=>assert.rejects(db.query("UPDATE public.staff SET role='admin'")));
    for (const [role,user] of [['anon',null],['authenticated',ids.cashier]]) await as(db,role,user,()=>assert.rejects(db.query("INSERT INTO storage.objects(bucket_id,name) VALUES ('product-images','bypass.png')")));
    await as(db,'authenticated',ids.manager,()=>assert.rejects(db.query('SELECT public.manage_staff_secure($1,$2,$3,$4)',[ids.admin,'delete',ids.cashier,'{}'])));
    await as(db,'service_role',null,async()=>{
      await assert.rejects(db.query('SELECT public.manage_staff_secure($1,$2,$3,$4)',[ids.manager,'delete',ids.cashier,'{}']),/Administrator access/);
      await assert.rejects(db.query('SELECT public.manage_staff_secure($1,$2,$3,$4)',[ids.admin,'delete',ids.admin,'{}']),/own administrator/);
      await db.query('SELECT public.manage_staff_secure($1,$2,$3,$4)',[ids.admin,'update',ids.cashier,JSON.stringify({name:'Cashier',phone:'9876543210',role:'cashier',status:'inactive'})]);
    });
    await as(db,'authenticated',ids.cashier,()=>assert.rejects(checkout(db,'30000000-0000-0000-0000-000000000007')));
  } finally { await db.close(); }
});
