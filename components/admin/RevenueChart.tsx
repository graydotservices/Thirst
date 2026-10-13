'use client';

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function RevenueChart({ data, showOrders = false }: {
  data: Array<{ date: string; revenue: number; orders?: number }>; showOrders?: boolean;
}) {
  return <ResponsiveContainer width="100%" height={showOrders ? 280 : 210}>
    <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
      <defs>
        <linearGradient id="salesRevenueGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#D94F8A" stopOpacity={0.25} /><stop offset="95%" stopColor="#D94F8A" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="salesOrdersGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#F4C95D" stopOpacity={0.25} /><stop offset="95%" stopColor="#F4C95D" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0e0eb" />
      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9c8490' }} axisLine={false} tickLine={false} />
      <YAxis yAxisId="revenue" tick={{ fontSize: 11, fill: '#9c8490' }} axisLine={false} tickLine={false}
        tickFormatter={value => value >= 1000 ? `₹${(value / 1000).toFixed(1)}k` : `₹${value}`} />
      {showOrders && <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 11, fill: '#9c8490' }} axisLine={false} tickLine={false} />}
      <Tooltip contentStyle={{ background: 'white', border: '1px solid #f0e0eb', borderRadius: 12, fontSize: 12 }}
        formatter={(value, name) => [name === 'Revenue' ? `₹${Number(value).toLocaleString('en-IN')}` : value, name]} />
      {showOrders && <Legend />}
      <Area yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue" stroke="#D94F8A" strokeWidth={2.5} fill="url(#salesRevenueGradient)" isAnimationActive={false} />
      {showOrders && <Area yAxisId="orders" type="monotone" dataKey="orders" name="Orders" stroke="#F4C95D" strokeWidth={2} fill="url(#salesOrdersGradient)" isAnimationActive={false} />}
    </AreaChart>
  </ResponsiveContainer>;
}
