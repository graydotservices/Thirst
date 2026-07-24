import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'daily';
    const now = new Date();

    let startDate: Date;
    if (range === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'completed');

    if (error) throw error;

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top products
    const productMap: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const order of orders) {
      for (const item of (order.items || [])) {
        if (!productMap[item.name]) {
          productMap[item.name] = { name: item.name, count: 0, revenue: 0 };
        }
        productMap[item.name].count += item.qty;
        productMap[item.name].revenue += item.total;
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Daily revenue for chart
    const revenueByDay: Record<string, number> = {};
    for (const order of orders) {
      const day = order.created_at.slice(0, 10);
      revenueByDay[day] = (revenueByDay[day] || 0) + order.total;
    }
    const chartData = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    return Response.json({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      topProducts,
      chartData,
      range,
    });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
