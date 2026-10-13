'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, ShoppingCart, Users, IndianRupee,
  ArrowUpRight, Clock, BarChart3, Eye,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { DashboardSummary } from '@/lib/analytics';
const RevenueChart = dynamic(() => import('@/components/admin/RevenueChart'), { loading: () => <div style={{ height: 210 }} /> });
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
  const [recentBills, setRecentBills] = useState<{ bill: string; customer: string; phone: string; items: number; total: number; method: string; time: string }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; orders: number; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  async function fetchDashboardData() {
    try {
      const { data, error } = await supabase.rpc('dashboard_summary');
      if (error || !data) throw error || new Error('No dashboard response');
      const summary = data as DashboardSummary;
      setStats(summary.stats);
      setChartData(summary.chartData);
      setTopProducts(summary.topProducts);
      setRecentBills(summary.recentBills.map(o => ({
        bill: o.bill_no, customer: o.customer_name || 'Guest',
        phone: (!o.customer_phone || o.customer_phone === '0000000000') ? '—' : o.customer_phone,
        items: (o.items || []).filter((item: OrderItem) => item.product_id !== 'meta_staff' && !item.name?.startsWith('Billed by:'))
          .reduce((sum, item) => sum + (Number(item.qty) || 1), 0),
        total: o.total, method: (o.payment_method || 'cash').toUpperCase(),
        time: new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
      })));
    } catch (e) {
      setLoadError('Unable to load dashboard. Check the connection and database migrations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good Morning');
    else if (hr < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    fetchDashboardData();
    });
  }, []);



  const statCards = [
    { label: "Today's Revenue", value: `₹${stats.todayRevenue.toLocaleString('en-IN')}`, change: 'Live', up: true, icon: IndianRupee, color: 'var(--color-berry)' },
    { label: "Today's Orders", value: stats.todayOrders.toString(), change: 'Live', up: true, icon: ShoppingCart, color: 'var(--color-gold-dark)' },
    { label: 'Active Customers', value: stats.activeCustomers.toLocaleString('en-IN'), change: 'Total', up: true, icon: Users, color: '#6366f1' },
    { label: 'Monthly Revenue', value: `₹${stats.monthlyRevenue.toLocaleString('en-IN')}`, change: 'This Month', up: true, icon: TrendingUp, color: 'var(--color-success)' },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><span className="spinner"></span></div>;

  if (loadError) return <div role="alert"><p>{loadError}</p><button className="btn btn-secondary" onClick={() => location.reload()}>Retry</button></div>;

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
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)', gap: 'var(--space-3)' }}>
        {statCards.map(({ label, value, change, icon: Icon, color }) => (
          <div key={label} className="stat-card" style={{ padding: 'clamp(12px, 3vw, 20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
              <div
                style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: `${color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color,
                  flexShrink: 0
                }}
              >
                <Icon size={20} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 700 }}>
                <ArrowUpRight size={13} />
                {change}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', color: 'var(--color-plum)', letterSpacing: '-0.02em', marginBottom: '2px', lineHeight: 1.15 }}>
              {value}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Chart + Top Products */}
      <div className="grid grid-chart" style={{ gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        {/* Revenue Chart */}
        <div className="card" style={{ padding: 'clamp(16px, 3vw, 24px)', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1rem' }}>Last 7 Days Revenue</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>Rolling Window</p>
            </div>
            <span className="badge badge-primary">Live</span>
          </div>
          <div style={{ width: '100%', height: 210, minWidth: 0 }}>
            <RevenueChart data={chartData} />
          </div>
        </div>

        {/* Top Products */}
        <div className="card" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1rem', marginBottom: 'var(--space-4)' }}>
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
