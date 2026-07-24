'use client';

import { useState } from 'react';
import { Search, UserPlus, Star, Phone, Mail, Calendar, ShoppingBag, X, Gift } from 'lucide-react';

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthday: string;
  loyaltyPoints: number;
  totalPurchase: number;
  lastVisit: string;
  visits: number;
};

const demoCustomers: Customer[] = [
  { id: '1', name: 'Priya Sharma', phone: '9876543210', email: 'priya@gmail.com', birthday: '1995-03-15', loyaltyPoints: 2340, totalPurchase: 234000, lastVisit: '2025-07-20', visits: 47 },
  { id: '2', name: 'Arjun Mehta', phone: '9876543211', email: 'arjun@gmail.com', birthday: '1990-07-23', loyaltyPoints: 1850, totalPurchase: 185000, lastVisit: '2025-07-18', visits: 38 },
  { id: '3', name: 'Sneha Patel', phone: '9876543212', email: 'sneha@gmail.com', birthday: '1998-12-08', loyaltyPoints: 980, totalPurchase: 98000, lastVisit: '2025-07-22', visits: 22 },
  { id: '4', name: 'Rohit Kapoor', phone: '9876543213', email: 'rohit@gmail.com', birthday: '1985-04-20', loyaltyPoints: 3200, totalPurchase: 320000, lastVisit: '2025-07-21', visits: 64 },
  { id: '5', name: 'Ananya Singh', phone: '9876543214', email: 'ananya@gmail.com', birthday: '2000-09-30', loyaltyPoints: 540, totalPurchase: 54000, lastVisit: '2025-07-15', visits: 12 },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(demoCustomers);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
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
          { label: 'Total Loyalty Points', value: customers.reduce((s, c) => s + c.loyaltyPoints, 0).toLocaleString('en-IN'), icon: Star, color: 'var(--color-gold-dark)' },
          { label: 'Total Revenue', value: `₹${(customers.reduce((s, c) => s + c.totalPurchase, 0) / 100000).toFixed(1)}L`, icon: ShoppingBag, color: '#6366f1' },
          { label: 'Avg. Visits', value: Math.round(customers.reduce((s, c) => s + c.visits, 0) / customers.length), icon: Calendar, color: 'var(--color-success)' },
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
            <tr><th>Customer</th><th>Phone</th><th>Email</th><th>Birthday</th><th>Last Visit</th><th>Loyalty Pts</th><th>Total Spent</th><th>Action</th></tr>
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
                <td><a href={`mailto:${c.email}`} style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{c.email}</a></td>
                <td style={{ fontSize: '0.875rem' }}>{new Date(c.birthday).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                <td style={{ fontSize: '0.875rem' }}>{new Date(c.lastVisit).toLocaleDateString('en-IN')}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={13} fill="var(--color-gold)" color="var(--color-gold)" />
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)' }}>{c.loyaltyPoints.toLocaleString('en-IN')}</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-berry)' }}>
                  ₹{c.totalPurchase.toLocaleString('en-IN')}
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} />{selected.email}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} />Birthday: {new Date(selected.birthday).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={22} /></button>
            </div>

            {/* Stats */}
            <div className="grid grid-4" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              {[
                { label: 'Total Spent', value: `₹${selected.totalPurchase.toLocaleString('en-IN')}`, icon: ShoppingBag },
                { label: 'Loyalty Points', value: selected.loyaltyPoints.toLocaleString('en-IN'), icon: Star },
                { label: 'Total Visits', value: selected.visits, icon: Calendar },
                { label: 'Last Visit', value: new Date(selected.lastVisit).toLocaleDateString('en-IN'), icon: Gift },
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
