'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, ShoppingCart, Users, IndianRupee,
  ArrowUpRight, Clock, BarChart3, Eye,
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { OrderItem } from '@/lib/supabase';

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('');
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    activeCustomers: 0,
    monthlyRevenue: 0,
  });
  const [chartData, setChartData] = useState<{ date: string; revenue: number }[]>([]);
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good Morning');
    else if (hr < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Fetch customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Fetch orders (last 30 days for safety)
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (allOrders) {
        // 1. KPI Stats
        const todayOrdersList = allOrders.filter(o => o.created_at >= startOfToday);
        const monthOrdersList = allOrders.filter(o => o.created_at >= startOfMonth);

        const todayRevenue = todayOrdersList.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        const monthlyRevenue = monthOrdersList.reduce((acc, o) => acc + (Number(o.total) || 0), 0);

        setStats({
          todayRevenue,
          todayOrders: todayOrdersList.length,
          activeCustomers: customersCount || 0,
          monthlyRevenue,
        });

        // 2. Recent Bills (Latest 5)
        setRecentBills(allOrders.slice(0, 5).map(o => ({
          bill: o.bill_no,
          customer: o.customer_name || 'Guest',
          phone: (!o.customer_phone || o.customer_phone === '0000000000') ? '—' : o.customer_phone,
          items: o.items 
            ? o.items
                .filter((item: any) => item.product_id !== 'meta_staff' && (!item.name || !item.name.startsWith('Billed by:')))
                .reduce((acc: number, item: any) => acc + (Number(item.qty) || 1), 0)
            : 0,
          total: o.total,
          method: (o.payment_method || 'CASH').toUpperCase(),
          time: new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        })));

        // 3. Chart Data (Last 7 Days)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const chart = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
          const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
          
          const dayRevenue = allOrders
            .filter(o => o.created_at >= startOfDay && o.created_at <= endOfDay)
            .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
            
          chart.push({
            date: days[d.getDay()],
            revenue: dayRevenue
          });
        }
        setChartData(chart);

        // 4. Top Products (Filtering out meta_staff)
        const productMap: Record<string, { name: string, orders: number, revenue: number }> = {};
        allOrders.forEach(o => {
          if (o.items && Array.isArray(o.items)) {
            o.items.forEach((item: any) => {
              if (item.product_id === 'meta_staff' || (item.name && item.name.startsWith('Billed by:'))) {
                return;
              }
              const key = item.product_id || item.name;
              if (!productMap[key]) {
                productMap[key] = { name: item.name || 'Product', orders: 0, revenue: 0 };
              }
              productMap[key].orders += (Number(item.qty) || 1);
              productMap[key].revenue += (Number(item.total) || ((Number(item.price) || 0) * (Number(item.qty) || 1)));
            });
          }
        });
        
        const sortedProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 4);
        setTopProducts(sortedProducts);
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Today's Revenue", value: `₹${stats.todayRevenue.toLocaleString('en-IN')}`, change: 'Live', up: true, icon: IndianRupee, color: 'var(--color-berry)' },
    { label: "Today's Orders", value: stats.todayOrders.toString(), change: 'Live', up: true, icon: ShoppingCart, color: 'var(--color-gold-dark)' },
    { label: 'Active Customers', value: stats.activeCustomers.toLocaleString('en-IN'), change: 'Total', up: true, icon: Users, color: '#6366f1' },
    { label: 'Monthly Revenue', value: `₹${stats.monthlyRevenue.toLocaleString('en-IN')}`, change: 'This Month', up: true, icon: TrendingUp, color: 'var(--color-success)' },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><span className="spinner"></span></div>;

  const maxRevenue = Math.max(...chartData.map(c => c.revenue), 0);

  return (
    <div style={{ maxWidth: 1400 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.35rem, 4vw, 1.75rem)', color: 'var(--color-plum)', letterSpacing: '-0.02em' }}>
          {greeting}, Admin 👋
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>
          Here&apos;s your Thirst. business summary for today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)', gap: 'var(--space-4)' }}>
        {statCards.map(({ label, value, change, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: `${color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color,
                }}
              >
                <Icon size={22} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontSize: '0.8125rem', fontWeight: 600 }}>
                <ArrowUpRight size={14} />
                {change}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: 'var(--color-plum)', letterSpacing: '-0.02em', marginBottom: '2px' }}>
              {value}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Chart + Top Products */}
      <div className="grid grid-chart" style={{ gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        {/* Revenue Chart */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.0625rem' }}>Last 7 Days Revenue</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Rolling Window</p>
            </div>
            <span className="badge badge-primary">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D94F8A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#D94F8A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e0eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9c8490' }} axisLine={false} tickLine={false} />
              <YAxis 
                tick={{ fontSize: 12, fill: '#9c8490' }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v}`} 
              />
              <Tooltip
                contentStyle={{ background: 'white', border: '1px solid #f0e0eb', borderRadius: 12, fontFamily: 'var(--font-heading)', fontSize: 13 }}
                formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#D94F8A" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: '#D94F8A', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.0625rem', marginBottom: 'var(--space-5)' }}>
            Top Products (Last 30 Days)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {topProducts.length === 0 ? <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No orders yet.</div> : topProducts.map((p, i) => (
              <div key={p.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-plum)', fontSize: '0.875rem' }}>
                    {i + 1}. {p.name}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>₹{p.revenue.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--color-lavender)' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: 'var(--gradient-berry)', width: `${Math.min((p.orders / (topProducts[0]?.orders || 1)) * 100, 100)}%`, transition: 'width 1s ease' }} />
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>{p.orders} orders</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bills with horizontal scroll wrapper */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ padding: 'var(--space-5) var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-lavender)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.0625rem' }}>Recent Bills</h3>
          <Link href="/admin/orders" className="btn btn-secondary btn-sm"><Eye size={14} /> View All</Link>
        </div>
        <div className="table-container" style={{ borderRadius: 0, border: 'none', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th>Bill No</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentBills.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>No bills generated yet.</td></tr>
              ) : recentBills.map(bill => (
                <tr key={bill.bill}>
                  <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-plum)' }}>{bill.bill}</td>
                  <td style={{ fontWeight: 500 }}>{bill.customer}</td>
                  <td>{bill.phone}</td>
                  <td>{bill.items}</td>
                  <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-berry)' }}>₹{bill.total.toLocaleString('en-IN')}</td>
                  <td><span className="badge badge-primary">{bill.method}</span></td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} style={{ color: 'var(--color-text-muted)' }} />
                    {bill.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-3" style={{ gap: 'var(--space-4)' }}>
        {[
          { href: '/admin/billing', label: 'New Bill', desc: 'Create a POS invoice', icon: ShoppingCart, color: 'var(--color-berry)' },
          { href: '/admin/customers', label: 'Add Customer', desc: 'Register new customer', icon: Users, color: '#6366f1' },
          { href: '/admin/reports', label: 'View Reports', desc: 'Detailed analytics', icon: BarChart3, color: 'var(--color-gold-dark)' },
        ].map(({ href, label, desc, icon: Icon, color }) => (
          <Link key={href} href={href} className="card" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', textDecoration: 'none' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
              <Icon size={22} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.9375rem' }}>{label}</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{desc}</div>
            </div>
            <ArrowUpRight size={16} style={{ color: 'var(--color-text-muted)', marginLeft: 'auto', transform: 'rotate(45deg)', opacity: 0.6 }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
