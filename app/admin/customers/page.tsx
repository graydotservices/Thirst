'use client';

import { useState, useEffect } from 'react';
import { Search, UserPlus, Star, Phone, Mail, Calendar, ShoppingBag, X, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  birthday: string | null;
  loyalty_points: number;
  total_purchase: number;
  last_visit: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('customers')
        .select('*')
        .order('last_visit', { ascending: false });
      
      if (data) setCustomers(data as Customer[]);
      setLoading(false);
    };
    fetchCustomers();
  }, []);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Customer CRM</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{customers.length} registered customers</p>
        </div>
        <button className="btn btn-primary"><UserPlus size={18} /> Add Customer</button>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)', gap: 'var(--space-4)' }}>
        {[
          { label: 'Total Customers', value: customers.length, icon: UserPlus, color: 'var(--color-berry)' },
          { label: 'Total Loyalty Points', value: customers.reduce((s, c) => s + c.loyalty_points, 0).toLocaleString('en-IN'), icon: Star, color: 'var(--color-gold-dark)' },
          { 
            label: 'Total Revenue', 
            value: (() => {
              const total = customers.reduce((s, c) => s + Number(c.total_purchase || 0), 0);
              return total >= 100000 ? `₹${(total / 100000).toFixed(1)}L` : `₹${total.toLocaleString('en-IN')}`;
            })(), 
            icon: ShoppingBag, color: '#6366f1' 
          },
          { label: 'Avg. Revenue/Cust', value: customers.length > 0 ? `₹${Math.round(customers.reduce((s, c) => s + Number(c.total_purchase || 0), 0) / customers.length).toLocaleString('en-IN')}` : '₹0', icon: Calendar, color: 'var(--color-success)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.375rem', color: 'var(--color-plum)' }}>{value}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-5)', maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input id="customer-search" className="input" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 44, background: 'white' }} />
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr><th>Customer</th><th>Phone</th><th>Last Visit</th><th>Loyalty Pts</th><th>Total Spent</th><th>Action</th></tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                      {c.name[0]}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{c.name}</span>
                  </div>
                </td>
                <td><a href={`tel:${c.phone}`} style={{ color: 'var(--color-text-secondary)' }}>{c.phone}</a></td>
                <td style={{ fontSize: '0.875rem' }}>{c.last_visit ? new Date(c.last_visit).toLocaleDateString('en-IN') : '-'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={13} fill="var(--color-gold)" color="var(--color-gold)" />
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)' }}>{c.loyalty_points.toLocaleString('en-IN')}</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-berry)' }}>
                  ₹{c.total_purchase.toLocaleString('en-IN')}
                </td>
                <td>
                  <button onClick={() => setSelected(c)} className="btn btn-secondary btn-sm">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Modal */}
      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--gradient-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.5rem' }}>
                  {selected.name[0]}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.375rem' }}>{selected.name}</h3>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} />{selected.phone}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={22} /></button>
            </div>

            {/* Stats */}
            <div className="grid grid-3" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              {[
                { label: 'Total Spent', value: `₹${selected.total_purchase.toLocaleString('en-IN')}`, icon: ShoppingBag },
                { label: 'Loyalty Points', value: selected.loyalty_points.toLocaleString('en-IN'), icon: Star },
                { label: 'Last Visit', value: selected.last_visit ? new Date(selected.last_visit).toLocaleDateString('en-IN') : '-', icon: Gift },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--color-lavender)', borderRadius: 'var(--radius-lg)' }}>
                  <Icon size={20} style={{ color: 'var(--color-berry)', margin: '0 auto var(--space-2)' }} />
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.125rem' }}>{value}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: 'var(--space-4)', background: 'rgba(217,79,138,0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(217,79,138,0.2)' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', textAlign: 'center' }}>
                🌟 Purchase history and detailed analytics visible after connecting Supabase.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
