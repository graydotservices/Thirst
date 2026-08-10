'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend,
} from 'recharts';
import { Download, TrendingUp, ShoppingCart, Users, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ranges = ['Daily', 'Weekly', 'Monthly', 'Yearly'] as const;

export default function ReportsPage() {
  const [range, setRange] = useState<typeof ranges[number]>('Weekly');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: true });
      if (data) setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const getChartData = () => {
    const dataMap = new Map<string, { revenue: number, orders: number }>();
    
    // Initialize default structure based on range
    if (range === 'Weekly') {
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => dataMap.set(d, { revenue: 0, orders: 0 }));
    } else if (range === 'Monthly') {
      ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].forEach(m => dataMap.set(m, { revenue: 0, orders: 0 }));
    }

    orders.forEach(o => {
      const date = new Date(o.created_at);
      let key = '';
      
      if (range === 'Daily') {
        const today = new Date();
        if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth()) {
          key = `${date.getHours()}:00`;
        }
      } else if (range === 'Weekly') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        key = days[date.getDay()];
      } else if (range === 'Monthly') {
        if (date.getFullYear() === new Date().getFullYear()) {
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          key = months[date.getMonth()];
        }
      } else if (range === 'Yearly') {
        key = date.getFullYear().toString();
      }
      
      if (key) {
        const curr = dataMap.get(key) || { revenue: 0, orders: 0 };
        dataMap.set(key, { revenue: curr.revenue + o.total, orders: curr.orders + 1 });
      }
    });

    return Array.from(dataMap.entries()).map(([date, stats]) => ({ date, ...stats }));
  };

  const getTopProducts = () => {
    const productMap = new Map<string, { orders: number, revenue: number }>();
    orders.forEach(o => {
      o.items?.forEach((item: any) => {
        if (item.product_id === 'meta_staff' || item.name.startsWith('Billed by:')) return;
        const curr = productMap.get(item.name) || { orders: 0, revenue: 0 };
        productMap.set(item.name, { orders: curr.orders + item.qty, revenue: curr.revenue + item.total });
      });
    });
    
    return Array.from(productMap.entries())
      .map(([name, stats]) => ({ name, ...stats, growth: 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const data = getChartData();
  const topProducts = getTopProducts();
  const uniqueCustomers = new Set(orders.map(o => o.customer_id).filter(id => id)).size;

  const totals = {
    revenue: orders.reduce((s, o) => s + o.total, 0),
    orders: orders.length,
    newCustomers: uniqueCustomers
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Business performance insights</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Range Toggle */}
          <div style={{ display: 'flex', background: 'white', borderRadius: 'var(--radius-full)', padding: '4px', border: '1px solid var(--color-lavender-dark)' }}>
            {ranges.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-full)', border: 'none',
                  background: range === r ? 'var(--color-berry)' : 'transparent',
                  color: range === r ? 'white' : 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.8125rem',
                  cursor: 'pointer', transition: 'all var(--transition-fast)',
                }}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm"><Download size={14} /> Export</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)', gap: 'var(--space-4)' }}>
        {[
          { label: `Total Revenue`, value: `₹${totals.revenue.toLocaleString()}`, icon: DollarSign, color: 'var(--color-berry)', change: '+--%' },
          { label: `Total Orders`, value: totals.orders.toLocaleString(), icon: ShoppingCart, color: '#6366f1', change: '+--%' },
          { label: 'Avg. Order Value', value: `₹${totals.orders > 0 ? Math.round(totals.revenue / totals.orders).toLocaleString() : 0}`, icon: TrendingUp, color: 'var(--color-gold-dark)', change: '+--%' },
          { label: 'New Customers', value: totals.newCustomers.toLocaleString(), icon: Users, color: 'var(--color-success)', change: '+--%' },
        ].map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                <Icon size={20} />
              </div>
              <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.8125rem', background: 'rgba(34,197,94,0.1)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>{change}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.625rem', color: 'var(--color-plum)' }}>{value}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-5)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', marginBottom: 'var(--space-5)' }}>Revenue & Orders — {range}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D94F8A" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#D94F8A" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="og2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F4C95D" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F4C95D" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e0eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9c8490' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#9c8490' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#9c8490' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'white', border: '1px solid #f0e0eb', borderRadius: 12, fontFamily: 'var(--font-heading)', fontSize: 12 }} />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#D94F8A" strokeWidth={2} fill="url(#rg2)" />
            <Area yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#F4C95D" strokeWidth={2} fill="url(#og2)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products Table */}
      <div className="card">
        <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-lavender)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)' }}>Top Performing Products</h3>
        </div>
        <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
          <table>
            <thead><tr><th>Rank</th><th>Product</th><th>Orders</th><th>Revenue</th><th>Growth</th></tr></thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={p.name}>
                  <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)' }}>#{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.orders.toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-berry)' }}>₹{p.revenue.toLocaleString('en-IN')}</td>
                  <td>
                    <span style={{ color: p.growth >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600, fontSize: '0.875rem', background: p.growth >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
                      {p.growth >= 0 ? '+' : ''}{p.growth}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
