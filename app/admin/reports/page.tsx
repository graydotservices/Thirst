'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend,
} from 'recharts';
import { Download, TrendingUp, ShoppingCart, Users, IndianRupee, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ranges = ['Daily', 'Weekly', 'Monthly', 'Yearly'] as const;

export default function ReportsPage() {
  const [range, setRange] = useState<typeof ranges[number]>('Weekly');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: true });
      if (data) setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const getChartData = () => {
    const dataMap = new Map<string, { revenue: number, orders: number }>();
    const now = new Date();

    if (range === 'Daily') {
      // 24 hours of today
      for (let h = 8; h <= 23; h++) {
        const hourLabel = `${h.toString().padStart(2, '0')}:00`;
        dataMap.set(hourLabel, { revenue: 0, orders: 0 });
      }

      orders.forEach(o => {
        const d = new Date(o.created_at);
        if (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        ) {
          const hourKey = `${d.getHours().toString().padStart(2, '0')}:00`;
          const curr = dataMap.get(hourKey) || { revenue: 0, orders: 0 };
          dataMap.set(hourKey, { revenue: curr.revenue + (o.total || 0), orders: curr.orders + 1 });
        }
      });
    } else if (range === 'Weekly') {
      // Rolling 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const past7Dates: { key: string, dateStr: string }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayName = days[d.getDay()];
        const key = `${dayName} (${d.getDate()}/${d.getMonth() + 1})`;
        past7Dates.push({ key, dateStr: d.toISOString().split('T')[0] });
        dataMap.set(key, { revenue: 0, orders: 0 });
      }

      orders.forEach(o => {
        const orderDateStr = new Date(o.created_at).toISOString().split('T')[0];
        const match = past7Dates.find(p => p.dateStr === orderDateStr);
        if (match) {
          const curr = dataMap.get(match.key) || { revenue: 0, orders: 0 };
          dataMap.set(match.key, { revenue: curr.revenue + (o.total || 0), orders: curr.orders + 1 });
        }
      });
    } else if (range === 'Monthly') {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      months.forEach(m => dataMap.set(m, { revenue: 0, orders: 0 }));

      orders.forEach(o => {
        const d = new Date(o.created_at);
        if (d.getFullYear() === now.getFullYear()) {
          const mKey = months[d.getMonth()];
          const curr = dataMap.get(mKey) || { revenue: 0, orders: 0 };
          dataMap.set(mKey, { revenue: curr.revenue + (o.total || 0), orders: curr.orders + 1 });
        }
      });
    } else if (range === 'Yearly') {
      const currentYear = now.getFullYear();
      [currentYear - 2, currentYear - 1, currentYear].forEach(yr => {
        dataMap.set(yr.toString(), { revenue: 0, orders: 0 });
      });

      orders.forEach(o => {
        const yr = new Date(o.created_at).getFullYear().toString();
        if (dataMap.has(yr)) {
          const curr = dataMap.get(yr) || { revenue: 0, orders: 0 };
          dataMap.set(yr, { revenue: curr.revenue + (o.total || 0), orders: curr.orders + 1 });
        }
      });
    }

    return Array.from(dataMap.entries()).map(([date, stats]) => ({ date, ...stats }));
  };

  const getTopProducts = () => {
    const productMap = new Map<string, { orders: number, revenue: number }>();
    orders.forEach(o => {
      o.items?.forEach((item: any) => {
        if (!item || item.product_id === 'meta_staff' || (item.name && item.name.startsWith('Billed by:'))) return;
        const curr = productMap.get(item.name) || { orders: 0, revenue: 0 };
        productMap.set(item.name, { orders: curr.orders + (item.qty || 1), revenue: curr.revenue + (item.total || 0) });
      });
    });
    
    return Array.from(productMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const exportCSV = () => {
    if (orders.length === 0) {
      alert('No orders available to export.');
      return;
    }

    const headers = ['Bill No', 'Date', 'Customer Phone', 'Payment Method', 'Subtotal (INR)', 'Discount (INR)', 'Tax (INR)', 'Total (INR)'];
    const rows = orders.map(o => [
      `"${o.bill_no || o.id}"`,
      `"${new Date(o.created_at).toLocaleString('en-IN')}"`,
      `"${o.customer_phone || 'Walk-in'}"`,
      `"${o.payment_method || 'Cash'}"`,
      o.subtotal || 0,
      o.discount || 0,
      o.tax || 0,
      o.total || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `thirst_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const data = getChartData();
  const topProducts = getTopProducts();
  const uniqueCustomers = new Set(orders.map(o => o.customer_phone || o.customer_id).filter(Boolean)).size;

  const totals = {
    revenue: orders.reduce((s, o) => s + (Number(o.total) || 0), 0),
    orders: orders.length,
    newCustomers: uniqueCustomers
  };

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', color: 'var(--color-plum)' }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Business performance and financial insights</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Range Toggle */}
          <div className="admin-tab-bar" style={{ display: 'flex', background: 'white', borderRadius: 'var(--radius-full)', padding: '3px', border: '1px solid var(--color-lavender-dark)' }}>
            {ranges.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  padding: '6px clamp(8px, 2.5vw, 14px)', borderRadius: 'var(--radius-full)', border: 'none',
                  background: range === r ? 'var(--color-berry)' : 'transparent',
                  color: range === r ? 'white' : 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.8rem',
                  cursor: 'pointer', transition: 'all var(--transition-fast)',
                }}
              >
                {r}
              </button>
            ))}
          </div>
          <button id="btn-export-reports" onClick={exportCSV} className="btn btn-secondary btn-sm" style={{ padding: '7px 14px' }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)', gap: 'var(--space-3)' }}>
        {[
          { label: `Total Revenue`, value: `₹${totals.revenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'var(--color-berry)', subtitle: 'Gross sales' },
          { label: `Total Orders`, value: totals.orders.toLocaleString('en-IN'), icon: ShoppingCart, color: '#6366f1', subtitle: 'Completed bills' },
          { label: 'Avg. Order', value: `₹${totals.orders > 0 ? Math.round(totals.revenue / totals.orders).toLocaleString('en-IN') : 0}`, icon: TrendingUp, color: 'var(--color-gold-dark)', subtitle: 'Per transaction' },
          { label: 'Customers', value: totals.newCustomers.toLocaleString('en-IN'), icon: Users, color: 'var(--color-success)', subtitle: 'Patrons' },
        ].map(({ label, value, icon: Icon, color, subtitle }) => (
          <div key={label} className="stat-card" style={{ padding: 'clamp(12px, 3vw, 18px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                <Icon size={18} />
              </div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', background: 'var(--color-lavender)', padding: '2px 7px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                {range}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.15rem, 4vw, 1.5rem)', color: 'var(--color-plum)', marginBottom: '2px', lineHeight: 1.15 }}>{value}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{label}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', marginTop: '2px', opacity: 0.8 }}>{subtitle}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card" style={{ padding: 'clamp(16px, 3vw, 24px)', marginBottom: 'var(--space-5)', minWidth: 0, overflow: 'hidden' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', marginBottom: 'var(--space-4)', fontSize: '1rem' }}>
          Revenue & Orders — {range}
        </h3>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, color: 'var(--color-text-muted)' }}>
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D94F8A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#D94F8A" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="og2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F4C95D" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F4C95D" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e0eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9c8490' }} axisLine={false} tickLine={false} />
              <YAxis 
                yAxisId="left" 
                tick={{ fontSize: 12, fill: '#9c8490' }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} 
              />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#9c8490' }} axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={(val: any, name: any) => [name === 'Revenue (₹)' ? `₹${Number(val).toLocaleString('en-IN')}` : val, name]}
                contentStyle={{ background: 'white', border: '1px solid #f0e0eb', borderRadius: 12, fontFamily: 'var(--font-heading)', fontSize: 12 }} 
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#D94F8A" strokeWidth={2} fill="url(#rg2)" />
              <Area yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#F4C95D" strokeWidth={2} fill="url(#og2)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Products Table */}
      <div className="card">
        <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-lavender)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)' }}>Top Performing Products</h3>
        </div>
        <div className="table-container" style={{ borderRadius: 0, border: 'none', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ minWidth: 600 }}>
            <thead>
              <tr><th>Rank</th><th>Product</th><th>Orders Sold</th><th>Revenue</th><th>Share of Sales</th></tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
                    No product sales recorded yet.
                  </td>
                </tr>
              ) : (
                topProducts.map((p, i) => {
                  const share = totals.revenue > 0 ? ((p.revenue / totals.revenue) * 100).toFixed(1) : '0';
                  return (
                    <tr key={p.name}>
                      <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)' }}>#{i + 1}</td>
                      <td style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{p.name}</td>
                      <td>{p.orders.toLocaleString('en-IN')} units</td>
                      <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-berry)' }}>₹{p.revenue.toLocaleString('en-IN')}</td>
                      <td>
                        <span style={{ color: 'var(--color-berry)', fontWeight: 600, fontSize: '0.8125rem', background: 'rgba(217,79,138,0.1)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
                          {share}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

