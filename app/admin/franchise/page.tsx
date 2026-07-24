'use client';

import { useState } from 'react';
import { Check, X, Eye, Clock } from 'lucide-react';

type App = { id: string; name: string; phone: string; email: string; city: string; budget: string; experience: string; message: string; status: 'pending' | 'reviewing' | 'approved' | 'rejected'; created_at: string; };
const demo: App[] = [
  { id: '1', name: 'Suresh Kumar', phone: '9876543210', email: 'suresh@gmail.com', city: 'Ahmedabad', budget: '18-28 Lakhs', experience: '3-5 years', message: 'Looking to open a franchise in the SG Highway area.', status: 'pending', created_at: '2025-07-22T14:30:00Z' },
  { id: '2', name: 'Meena Reddy', phone: '9876543211', email: 'meena@gmail.com', city: 'Hyderabad', budget: '35-50 Lakhs', experience: '5+ years in F&B', message: 'Want to expand my restaurant chain into desserts.', status: 'reviewing', created_at: '2025-07-20T10:00:00Z' },
  { id: '3', name: 'Amit Joshi', phone: '9876543212', email: 'amit@gmail.com', city: 'Jaipur', budget: '8-12 Lakhs', experience: 'None', message: 'First time entrepreneur, passionate about desserts.', status: 'approved', created_at: '2025-07-18T09:00:00Z' },
  { id: '4', name: 'Kavya Nair', phone: '9876543213', email: 'kavya@gmail.com', city: 'Kochi', budget: '18-28 Lakhs', experience: '1-3 years', message: 'Running a small bakery, want to upgrade to a Thirst. franchise.', status: 'rejected', created_at: '2025-07-15T16:00:00Z' },
];

const statusColors: Record<string, string> = { pending: 'badge-warning', reviewing: 'badge-primary', approved: 'badge-success', rejected: 'badge-error' };

export default function FranchiseAdminPage() {
  const [apps, setApps] = useState<App[]>(demo);
  const [selected, setSelected] = useState<App | null>(null);

  const updateStatus = (id: string, status: App['status']) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Franchise Applications</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{apps.filter(a => a.status === 'pending').length} pending · {apps.filter(a => a.status === 'reviewing').length} reviewing</p>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>Applicant</th><th>City</th><th>Budget</th><th>Experience</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {apps.map(a => (
              <tr key={a.id}>
                <td><div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{a.name}</div><div style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{a.phone}</div></td>
                <td>{a.city}</td>
                <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{a.budget}</td>
                <td style={{ fontSize: '0.875rem' }}>{a.experience}</td>
                <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} />{new Date(a.created_at).toLocaleDateString('en-IN')}</div></td>
                <td><span className={`badge ${statusColors[a.status]}`}>{a.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button onClick={() => setSelected(a)} className="btn btn-secondary btn-sm"><Eye size={13} /> View</button>
                    {a.status === 'pending' && <button onClick={() => updateStatus(a.id, 'reviewing')} className="btn btn-sm" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: 'none', borderRadius: 'var(--radius-full)', padding: '8px 12px', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.8125rem' }}>Review</button>}
                    {a.status === 'reviewing' && (
                      <>
                        <button onClick={() => updateStatus(a.id, 'approved')} style={{ padding: '8px', background: 'rgba(34,197,94,0.1)', color: 'var(--color-success)', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}><Check size={14} /></button>
                        <button onClick={() => updateStatus(a.id, 'rejected')} style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}><X size={14} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.25rem' }}>Application Details</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={22} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {[['Name', selected.name], ['Phone', selected.phone], ['Email', selected.email], ['City', selected.city], ['Budget', selected.budget], ['Experience', selected.experience]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.8125rem', minWidth: 100, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{k}</span>
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              {selected.message && (
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Message</div>
                  <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, background: 'var(--color-lavender)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>{selected.message}</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
                {selected.status !== 'approved' && <button onClick={() => updateStatus(selected.id, 'approved')} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--color-success)' }}><Check size={16} /> Approve</button>}
                {selected.status !== 'rejected' && <button onClick={() => updateStatus(selected.id, 'rejected')} className="btn" style={{ flex: 1, justifyContent: 'center', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-heading)', fontWeight: 600, cursor: 'pointer' }}><X size={16} /> Reject</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
