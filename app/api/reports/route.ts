import { apiError, json, requireStaff } from '@/lib/security/server';
import { MANAGERS } from '@/lib/security/roles';
import { choice, HttpError } from '@/lib/security/validation';

type Sale = { total: number; created_at: string; items: Array<{name:string;qty:number;total:number;product_id?:string}> };
export async function GET(request: Request) {
  try {
    const { client } = await requireStaff(request, MANAGERS);
    const range = choice(new URL(request.url).searchParams.get('range') || 'daily', ['daily','weekly','monthly','yearly'] as const, 'range');
    const local = new Date(Date.now() + 19800000).toISOString().slice(0,10);
    const day = range === 'monthly' ? local.slice(0,7) + '-01' : range === 'yearly' ? local.slice(0,4) + '-01-01' : local;
    const start = new Date(`${day}T00:00:00+05:30`);
    if (range === 'weekly') start.setTime(start.getTime() - 6 * 86400000);
    const orders: Sale[] = [];
    for (let offset=0; ; offset+=1000) {
      if (offset >= 100000) throw new HttpError(422, 'Select a smaller report period');
      const { data, error } = await client.from('orders').select('id,total,created_at,items').eq('status','completed')
        .gte('created_at',start.toISOString()).order('created_at').order('id').range(offset,offset+999);
      if (error) throw error;
      orders.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    const totalRevenue = orders.reduce((sum,o)=>sum+Number(o.total),0);
    const products = new Map<string,{name:string;count:number;revenue:number}>();
    const daily = new Map<string,number>();
    for (const order of orders) {
      for (const item of order.items || []) {
        if (item.product_id === 'meta_staff') continue;
        const entry = products.get(item.name) || {name:item.name,count:0,revenue:0};
        entry.count += Number(item.qty); entry.revenue += Number(item.total); products.set(item.name,entry);
      }
      const date = new Date(Date.parse(order.created_at)+19800000).toISOString().slice(0,10);
      daily.set(date,(daily.get(date)||0)+Number(order.total));
    }
    return json({totalRevenue,totalOrders:orders.length,avgOrderValue:orders.length?totalRevenue/orders.length:0,
      topProducts:[...products.values()].sort((a,b)=>b.revenue-a.revenue).slice(0,10),
      chartData:[...daily].sort(([a],[b])=>a.localeCompare(b)).map(([date,revenue])=>({date,revenue})),range});
  } catch (error) { return apiError(error); }
}
