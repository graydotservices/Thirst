'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, ShoppingCart, Users, DollarSign,
  ArrowUpRight, Clock, BarChart3, Eye,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';

// Demo data
const demoChartData = [
  { date: 'Mon', revenue: 12400 },
  { date: 'Tue', revenue: 18200 },
  { date: 'Wed', revenue: 15800 },
  { date: 'Thu', revenue: 22100 },
  { date: 'Fri', revenue: 28400 },
  { date: 'Sat', revenue: 35600 },
  { date: 'Sun', revenue: 31200 },
];

const recentBills = [
  { bill: 'TH-00012345', customer: 'Priya Sharma', phone: '9876543210', items: 3, total: 1450, method: 'UPI', time: '2:30 PM' },
  { bill: 'TH-00012344', customer: 'Arjun Mehta', phone: '9876543211', items: 2, total: 680, method: 'Card', time: '2:15 PM' },
  { bill: 'TH-00012343', customer: 'Sneha Patel', phone: '9876543212', items: 5, total: 2200, method: 'Cash', time: '1:50 PM' },
  { bill: 'TH-00012342', customer: 'Rohit Kapoor', phone: '9876543213', items: 1, total: 320, method: 'UPI', time: '1:30 PM' },
  { bill: 'TH-00012341', customer: 'Ananya Singh', phone: '9876543214', items: 4, total: 1890, method: 'Card', time: '1:15 PM' },
];

const topProducts = [
  { name: 'Rose Velvet Cake', orders: 48, revenue: 40800 },
  { name: 'Berry Blast Scoop', orders: 72, revenue: 23040 },
  { name: 'Gold Parfait', orders: 35, revenue: 16800 },
  { name: 'Midnight Cheesecake', orders: 22, revenue: 26400 },
];

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good Morning');
    else if (hr < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const stats = [
    { label: "Today's Revenue", value: '₹63,840', change: '+18.2%', up: true, icon: DollarSign, color: 'var(--color-berry)' },
    { label: "Today's Orders", value: '142', change: '+9 from yesterday', up: true, icon: ShoppingCart, color: 'var(--color-gold-dark)' },
    { label: 'Active Customers', value: '2,341', change: '+34 this week', up: true, icon: Users, color: '#6366f1' },
    { label: 'Monthly Revenue', value: '₹8.4L', change: '+22.5% vs last month', up: true, icon: TrendingUp, color: 'var(--color-success)' },
  ];

  return (
    <div style={{ maxWidth: 1400 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: 'var(--color-plum)', letterSpacing: '-0.02em' }}>
          {greeting}, Admin 👋
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Here&apos;s your Thirst. business summary for today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)', gap: 'var(--space-4)' }}>
        {stats.map(({ label, value, change, up, icon: Icon, color }) => (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: up ? 'var(--color-success)' : 'var(--color-error)', fontSize: '0.8125rem', fontWeight: 600 }}>
                <ArrowUpRight size={14} />
                {change.split(' ')[0]}
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
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        {/* Revenue Chart */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.0625rem' }}>Weekly Revenue</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Mon — Sun</p>
            </div>
            <span className="badge badge-primary">This Week</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={demoChartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D94F8A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#D94F8A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e0eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9c8490' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9c8490' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'white', border: '1px solid #f0e0eb', borderRadius: 12, fontFamily: 'var(--font-heading)', fontSize: 13 }}
                formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#D94F8A" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: '#D94F8A', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.0625rem', marginBottom: 'var(--space-5)' }}>
            Top Products
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {topProducts.map((p, i) => (
              <div key={p.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-plum)', fontSize: '0.875rem' }}>
                    {i + 1}. {p.name}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>₹{p.revenue.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--color-lavender)' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: 'var(--gradient-berry)', width: `${(p.orders / 80) * 100}%`, transition: 'width 1s ease' }} />
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>{p.orders} orders</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bills */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ padding: 'var(--space-5) var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-lavender)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.0625rem' }}>Recent Bills</h3>
          <Link href="/admin/billing" className="btn btn-secondary btn-sm"><Eye size={14} /> View All</Link>
        </div>
        <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
          <table>
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
              {recentBills.map(bill => (
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
