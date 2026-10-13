import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname,'..');
const staffId='10000000-0000-0000-0000-000000000001';
const token='valid-test-token-123456789';
function context({role='admin',status='active',valid=true,rate=true,configured=true,globals={},tableData={}}={}) {
  const cache=new Map(); const calls=[]; const queries=[];
  const sdk={createClient(url,key,options){
    calls.push({url,key,options});
    return {auth:{getUser:async()=>({data:{user:valid?{id:staffId,email:'admin@test.invalid',email_confirmed_at:'2026-01-01'}:null},error:valid?null:{}})},
      from(table){queries.push(table);let data=tableData[table] || {id:staffId,auth_user_id:staffId,name:'Admin',email:'admin@test.invalid',role,status};return {
        select(){return this},eq(){return this},upsert(payload){data={...data,...payload};return this},
        single:async()=>({data,error:null}),maybeSingle:async()=>({data,error:null}),
      }},
      rpc:async(name)=>({data:name==='consume_api_rate_limit'?rate:null,error:null})};
  }};
  function load(file) {
    const full=path.resolve(root,file);
    if(cache.has(full))return cache.get(full).exports;
    const testModule={exports:{}};cache.set(full,testModule);
    const code=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
    const localRequire=(name)=>{
      if(name==='server-only')return {};
      if(name==='@supabase/supabase-js')return sdk;
      if(name.startsWith('@/'))return load(name.slice(2)+'.ts');
      if(name.startsWith('.'))return load(path.relative(root,path.resolve(path.dirname(full),name))+'.ts');
      return require(name);
    };
    vm.runInNewContext(code,{module:testModule,exports:testModule.exports,require:localRequire,Request,Response,Headers,URL,URLSearchParams,AbortSignal,AbortController,TextDecoder,Uint8Array,Buffer,crypto:webcrypto,
      process:{env:configured?{NEXT_PUBLIC_SUPABASE_URL:'https://project.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'test-anon',SUPABASE_SERVICE_ROLE_KEY:'test-service'}:{}},console,...globals},{filename:file});
    return testModule.exports;
  }
  return {load,calls,queries};
}

test('public catalog uses only anonymous credentials and caches only available menu data',async()=>{
  const requests=[];
  const env=context({globals:{fetch:async(url,options)=>{requests.push({url,options});return Response.json([{id:staffId,name:'Cake'}]);}}});
  const catalog=await env.load('lib/publicCatalog.ts').publicCatalog();
  assert.equal(catalog.items.length,1);assert.equal(catalog.error,'');
  assert.equal(requests.length,1);
  assert.equal(requests[0].options.headers.apikey,'test-anon');
  assert.equal(requests[0].options.headers.Authorization,'Bearer test-anon');
  assert.equal(requests[0].options.next.revalidate,60);
  assert.equal(requests[0].url.searchParams.get('is_available'),'eq.true');
  assert.equal(requests[0].url.searchParams.get('stock'),'gt.0');
  assert.equal(requests[0].url.searchParams.get('limit'),'500');
  const missing=context({configured:false});
  assert.equal((await missing.load('lib/publicCatalog.ts').publicCatalog()).items.length,0);
});

test('company settings coalesce concurrent public reads and immediately reflect saved changes',async()=>{
  let reads=0;
  const env=context({globals:{fetch:async()=>{reads++;return Response.json([{id:'primary',name:'Cached business'}]);}},tableData:{company_settings:{id:'primary',name:'Cached business'}}});
  const settings=env.load('lib/companySettings.ts');
  const results=await Promise.all([settings.fetchCompanySettings(),settings.fetchCompanySettings(),settings.fetchCompanySettings()]);
  assert(results.every(result=>result.name==='Cached business'));
  assert.equal(reads,1);assert.equal(env.queries.length,0);
  assert.equal((await settings.saveCompanySettings({name:'Updated business'})).success,true);
  assert.equal((await settings.fetchCompanySettings()).name,'Updated business');
  assert.equal(env.queries.length,1);assert.equal(reads,1);
});

test('request cancellation and deadlines also work in browsers without AbortSignal.any',()=>{
  for (const cause of ['caller','deadline']) {
    const caller = new AbortController(), deadline = new AbortController();
    const env = context({globals:{AbortSignal:{timeout:()=>deadline.signal}}});
    const combined = env.load('lib/requestSignal.ts').requestSignal(caller.signal);
    assert.equal(combined.aborted,false);
    (cause==='caller' ? caller : deadline).abort(cause);
    assert.equal(combined.aborted,true); assert.equal(combined.reason,cause);
  }
});
function request(method='GET',body,headers={}) {
  return new Request('https://shop.test/api/test',{method,headers:{Authorization:`Bearer ${token}`,...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
}

test('all private API methods reject absent bearer tokens before any database calls',async()=>{
  for(const [file,methods] of Object.entries({
    'orders':['GET','POST','PATCH'],products:['GET','POST','PUT','DELETE'],reports:['GET'],staff:['POST','PUT','DELETE'],'auth/me':['GET'],franchise:['GET'],
  })) {
    const env=context(); const route=env.load(`app/api/${file}/route.ts`);
    for(const method of methods){const req=request(method,method==='GET'||method==='DELETE'?undefined:{},{Authorization:''});const response=await route[method](req);assert.equal(response.status,401,`${file}:${method}`);}
    assert.equal(env.calls.length,0);
  }
});

test('API guards reject inactive/non-staff identities, enforce cashier/manager restrictions, and rate limit',async()=>{
  for(const options of [{valid:false},{status:'inactive'},{role:'outsider'}]) {
    const env=context(options); const response=await env.load('app/api/auth/me/route.ts').GET(request());
    assert.equal(response.status,options.valid===false?401:403);
  }
  for(const role of ['cashier','manager']) {
    const env=context({role});const staff=env.load('app/api/staff/route.ts');
    assert.equal((await staff.POST(request('POST',{}))).status,403);
    assert.equal((await staff.PUT(request('PUT',{}))).status,403);
    assert.equal((await staff.DELETE(request('DELETE'))).status,403);
    if(role==='cashier')for(const endpoint of ['reports','orders','franchise'])assert.equal((await env.load(`app/api/${endpoint}/route.ts`).GET(request())).status,403);
  }
  const env=context({rate:false});assert.equal((await env.load('app/api/auth/me/route.ts').GET(request())).status,429);
});

test('authenticated database clients forward the verified token and never persist server sessions',async()=>{
  const env=context();const server=env.load('lib/security/server.ts');
  await server.requireStaff(request());
  await server.requireStaff(request('GET',undefined,{Authorization:'Bearer different-test-token-123456789'}));
  assert.equal(env.calls.length,2);
  assert.equal(env.calls[0].options.global.headers.Authorization,`Bearer ${token}`);
  assert.equal(env.calls[1].options.global.headers.Authorization,'Bearer different-test-token-123456789');
  for(const call of env.calls){assert.equal(call.options.auth.persistSession,false);assert.equal(call.options.auth.autoRefreshToken,false);}
});

test('cross-origin requests, oversized streamed JSON, malformed JSON and mass assignment fail closed',async()=>{
  const env=context();const server=env.load('lib/security/server.ts');
  await assert.rejects(server.requireStaff(request('POST',{}, {Origin:'https://attacker.invalid'})),error=>error.status===403);
  await assert.rejects(server.jsonBody(request('POST',{admin:true}),['name']),error=>error.status===400);
  await assert.rejects(server.jsonBody(request('POST',{name:'a'.repeat(33000)}),['name']),error=>error.status===413);
  const malformed=new Request('https://shop.test/api/test',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"name":'});
  await assert.rejects(server.jsonBody(malformed,['name']),error=>error.status===400);
  const badType=new Request('https://shop.test/api/test',{method:'POST',body:'name=test'});
  await assert.rejects(server.jsonBody(badType,['name']),error=>error.status===415);
  const api=env.load('app/api/orders/route.ts');
  assert.equal((await api.POST(request('POST',{items:[],role:'admin'}))).status,400);
});

test('checkout input rejects negative/fractional quantities, duplicate products and forged fields',()=>{
  const env=context(); const {orderInput}=env.load('lib/security/orders.ts');
  const good={items:[{product_id:staffId,qty:1,price:100}],customer_phone:'9876543210',discount_percent:0,payment_method:'cash',request_id:staffId};
  for(const qty of [-1,0,1.5,Infinity])assert.throws(()=>orderInput({...good,items:[{product_id:staffId,qty}]}));
  assert.throws(()=>orderInput({...good,items:[good.items[0],good.items[0]]}));
  assert.throws(()=>orderInput({...good,items:[{...good.items[0],name:'Forged'}]}));
  assert.throws(()=>orderInput({...good,discount_percent:101}));
  assert.throws(()=>orderInput({...good,customer_phone:'12345'}));
  assert.equal(orderInput(good).p_customer_phone,'9876543210');
});

test('receipt text is encoded, CSP blocks inline scripts and only allows the configured storage origin',()=>{
  const env=context();const {escapeHtml}=env.load('lib/security/html.ts');
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  const {contentSecurityPolicy}=env.load('lib/security/csp.ts');
  const csp=contentSecurityPolicy('test-nonce',false,'https://project.supabase.co');
  const scripts=csp.split('; ').find(value=>value.startsWith('script-src'));
  assert(scripts.includes("'nonce-test-nonce'")); assert(!scripts.includes('unsafe-inline')); assert(!scripts.includes('unsafe-eval'));
  assert(csp.includes("frame-ancestors 'none'")); assert(!csp.includes('*.supabase.co'));
  const {imageUrl}=env.load('lib/security/validation.ts');
  assert.throws(()=>imageUrl('https://attacker.supabase.co/storage/v1/object/public/product-images/test.png'));
  assert.throws(()=>imageUrl('javascript:alert(1)')); assert.throws(()=>imageUrl('blob:temporary'));
});

test('errors and unconfigured services never expose backend details or use a service key fallback',async()=>{
  const env=context({configured:false});const server=env.load('lib/security/server.ts');
  assert.throws(()=>server.adminClient(),error=>error.status===503);
  assert.equal((await env.load('app/api/auth/me/route.ts').GET(request())).status,503);
  const result=server.apiError(new Error('sensitive-database-details'));
  assert.equal(result.status,500); assert(!JSON.stringify(await result.json()).includes('sensitive-database-details'));
  assert.equal(result.headers.get('Cache-Control'),'no-store, private');
});

test('actual thermal receipt escapes every stored text source and forbids scripts in its iframe',()=>{
  let html='';const attributes={};
  const document={createElement:()=>({style:{},setAttribute:(key,value)=>{attributes[key]=value;},contentWindow:{document:{open(){},write(value){html=value;},close(){}}}}),body:{appendChild(){}}};
  const env=context({globals:{document}});const pdf=env.load('lib/pdfUtils.ts');
  const payload='<img src=x onerror="parent.compromised=1">';
  pdf.printThermalReceipt({bill_no:payload,created_at:'2026-10-13T00:00:00Z',customer_name:payload,customer_phone:payload,
    billed_by:payload,items:[{name:payload,qty:1,price:100,total:100}],subtotal:100,discount:0,gst:0,total:100,payment_method:'cash'},'80mm',
    {name:payload,tagline:payload,address_line1:payload,address_line2:payload,city:payload,pincode:'602001',phone:payload,gstin:payload,fssai:payload});
  assert(!html.includes('<img'));assert(html.includes('&lt;img'));
  assert.equal(attributes.sandbox,'allow-same-origin allow-modals');assert(!attributes.sandbox.includes('allow-scripts'));
});

test('spreadsheet exports neutralize formula cells and quote embedded delimiters',()=>{
  const {csvCell}=context().load('lib/security/csv.ts');
  assert.equal(csvCell('=SUM(1,2)'), '"\'=SUM(1,2)"');
  assert.equal(csvCell('  @command'), '"\'  @command"');
  assert.equal(csvCell('name, "quoted" text'), '"name, ""quoted"" text"');
});

test('dashboard access is explicitly allowed by role and denies unknown manager routes',()=>{
  const {canAccessDashboard}=context().load('lib/security/roles.ts');
  assert.equal(canAccessDashboard('cashier','/admin/billing'),true);
  assert.equal(canAccessDashboard('cashier','/admin/staff'),false);
  assert.equal(canAccessDashboard('manager','/admin/inventory'),true);
  for(const route of ['/admin/staff','/admin/locations','/admin/staff/new','/admin/future-sensitive-route']) assert.equal(canAccessDashboard('manager',route),false);
  assert.equal(canAccessDashboard('outsider','/admin/dashboard'),false);
});
