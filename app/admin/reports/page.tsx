'use client';

import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend,
} from 'recharts';
import { Download, TrendingUp, ShoppingCart, Users, DollarSign } from 'lucide-react';

const ranges = ['Daily', 'Weekly', 'Monthly', 'Yearly'] as const;

const chartData: Record<string, { date: string; revenue: number; orders: number }[]> = {
  Daily: [
    { date: '10AM', revenue: 4200, orders: 12 },
    { date: '11AM', revenue: 7800, orders: 18 },
    { date: '12PM', revenue: 12400, orders: 31 },
    { date: '1PM', revenue: 9600, orders: 24 },
    { date: '2PM', revenue: 8100, orders: 19 },
    { date: '3PM', revenue: 6300, orders: 15 },
    { date: '4PM', revenue: 11200, orders: 28 },
    { date: '5PM', revenue: 15800, orders: 38 },
    { date: '6PM', revenue: 18400, orders: 45 },
  ],
  Weekly: [
    { date: 'Mon', revenue: 48200, orders: 142 },
    { date: 'Tue', revenue: 52400, orders: 156 },
    { date: 'Wed', revenue: 43100, orders: 128 },
    { date: 'Thu', revenue: 58900, orders: 171 },
    { date: 'Fri', revenue: 74200, orders: 204 },
    { date: 'Sat', revenue: 92600, orders: 267 },
    { date: 'Sun', revenue: 84400, orders: 242 },
  ],
  Monthly: Array.from({ length: 12 }, (_, i) => ({
    date: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    revenue: Math.floor(Math.random() * 400000 + 600000),
    orders: Math.floor(Math.random() * 1500 + 3000),
  })),
  Yearly: [
    { date: '2021', revenue: 3200000, orders: 18400 },
    { date: '2022', revenue: 5800000, orders: 34200 },
    { date: '2023', revenue: 8400000, orders: 52100 },
    { date: '2024', revenue: 12600000, orders: 78300 },
    { date: '2025', revenue: 9800000, orders: 61200 },
  ],
};

const topProducts = [
  { name: 'Rose Velvet Cake', orders: 482, revenue: 409700, growth: 18 },
  { name: 'Berry Blast Scoop', orders: 724, revenue: 231680, growth: 24 },
  { name: 'Gold Parfait', orders: 351, revenue: 168480, growth: 12 },
  { name: 'Midnight Cheesecake', orders: 223, revenue: 267600, growth: -3 },
  { name: 'Waffles Royale', orders: 410, revenue: 221400, growth: 8 },
];

export default function ReportsPage() {
  const [range, setRange] = useState<typeof ranges[number]>('Weekly');
  const data = chartData[range];

  const totals = {
    revenue: data.reduce((s, d) => s + d.revenue, 0),
    orders: data.reduce((s, d) => s + d.orders, 0),
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
          { label: `${range} Revenue`, value: `₹${(totals.revenue / 100000).toFixed(1)}L`, icon: DollarSign, color: 'var(--color-berry)', change: '+18.2%' },
          { label: `${range} Orders`, value: totals.orders.toLocaleString(), icon: ShoppingCart, color: '#6366f1', change: '+9.4%' },
          { label: 'Avg. Order Value', value: `₹${Math.round(totals.revenue / totals.orders).toLocaleString()}`, icon: TrendingUp, color: 'var(--color-gold-dark)', change: '+5.1%' },
          { label: 'New Customers', value: '342', icon: Users, color: 'var(--color-success)', change: '+22%' },
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
