'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { SalesSummary } from '@/lib/analytics';
const RevenueChart = dynamic(() => import('@/components/admin/RevenueChart'), { loading: () => <div style={{ height: 280 }} /> });
import { Download, TrendingUp, ShoppingCart, Users, IndianRupee, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { csvCell } from '@/lib/security/csv';

const ranges = ['Daily', 'Weekly', 'Monthly', 'Yearly'] as const;

export default function ReportsPage() {
  const [range, setRange] = useState<typeof ranges[number]>('Weekly');
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      setLoading(true); setSummary(null); setLoadError('');
      try {
        const { data, error } = await supabase.rpc('sales_summary', { p_range: range.toLowerCase() }).abortSignal(controller.signal);
        if (!active) return;
        if (error || !data) throw error || new Error('No report response');
        setSummary(data as SalesSummary);
      } catch {
        if (active) setLoadError('Unable to load reports. Check the connection and database migrations.');
      } finally { if (active) setLoading(false); }
    });
    return () => { active = false; controller.abort(); };
  }, [range]);

  const exportCSV = async () => {
    if (!summary || exporting) return;
    if (summary.totalOrders > 100_000) { setLoadError('Select a smaller period to export more than 100,000 bills.'); return; }
    setExporting(true); setLoadError('');
    try {
      const rows: string[] = ['Bill No,Date,Customer Phone,Payment Method,Subtotal (INR),Discount (INR),Tax (INR),Total (INR)'];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from('orders')
          .select('id,bill_no,created_at,customer_phone,payment_method,subtotal,discount,gst,total')
          .eq('status','completed').gte('created_at',summary.periodStart).lt('created_at',summary.periodEnd)
          .order('created_at').order('id').range(offset,offset + 499);
        if (error) throw error;
        for (const order of data || []) rows.push([
          order.bill_no || order.id, new Date(order.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          order.customer_phone, order.payment_method, order.subtotal, order.discount, order.gst, order.total,
        ].map(csvCell).join(','));
        if (!data || data.length < 500) break;
        if (offset >= 99_500) throw new Error('Export limit reached');
      }
      const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url;
      link.download = 'thirst_sales_report_' + range.toLowerCase() + '.csv';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setLoadError('Unable to export this period. Please check the connection and try again.'); }
    finally { setExporting(false); }
  };

  const data = summary?.chartData || [];
  const topProducts = (summary?.topProducts || []).slice(0,5);
  const totals = { revenue: summary?.totalRevenue || 0, orders: summary?.totalOrders || 0, newCustomers: summary?.uniqueCustomers || 0 };


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
          <button id="btn-export-reports" onClick={exportCSV} disabled={loading || exporting || !summary} className="btn btn-secondary btn-sm" style={{ padding: '7px 14px' }}>
            <Download size={14} /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {loadError && <p role="alert" style={{ color: 'var(--color-error)', marginBottom: 16 }}>{loadError}</p>}
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
          <RevenueChart data={data} showOrders />
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

