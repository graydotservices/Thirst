'use client';

import { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Eye, 
  Clock, 
  Edit3, 
  DollarSign, 
  MessageCircle, 
  Phone, 
  Mail, 
  Save, 
  Sparkles,
  Building 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createWhatsAppUrl, formatIndianPhoneDisplay } from '@/lib/companySettings';

type App = { 
  id: string; 
  name: string; 
  phone: string; 
  email: string; 
  city: string; 
  budget: string; 
  experience: string; 
  message: string; 
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'; 
  created_at: string; 
};

const demo: App[] = [
  { id: '1', name: 'Suresh Kumar', phone: '9876543210', email: 'suresh@gmail.com', city: 'Ahmedabad', budget: '18-28 Lakhs', experience: '3-5 years', message: 'Looking to open a franchise in the SG Highway area.', status: 'pending', created_at: '2025-07-22T14:30:00Z' },
  { id: '2', name: 'Meena Reddy', phone: '9876543211', email: 'meena@gmail.com', city: 'Hyderabad', budget: 'Custom: ₹45,00,000', experience: '5+ years in F&B', message: 'Want to expand my restaurant chain into desserts.', status: 'reviewing', created_at: '2025-07-20T10:00:00Z' },
  { id: '3', name: 'Amit Joshi', phone: '9876543212', email: 'amit@gmail.com', city: 'Jaipur', budget: '8-12 Lakhs', experience: 'None', message: 'First time entrepreneur, passionate about desserts.', status: 'approved', created_at: '2025-07-18T09:00:00Z' },
  { id: '4', name: 'Kavya Nair', phone: '9876543213', email: 'kavya@gmail.com', city: 'Kochi', budget: 'Custom: ₹25,00,000', experience: '1-3 years', message: 'Running a small bakery, want to upgrade to a Thirst. franchise.', status: 'rejected', created_at: '2025-07-15T16:00:00Z' },
];

const statusColors: Record<string, string> = { 
  pending: 'badge-warning', 
  reviewing: 'badge-primary', 
  approved: 'badge-success', 
  rejected: 'badge-error' 
};

export default function FranchiseAdminPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<App | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Budget Editing state
  const [editingBudgetApp, setEditingBudgetApp] = useState<App | null>(null);
  const [budgetType, setBudgetType] = useState<'preset' | 'custom'>('preset');
  const [customBudgetVal, setCustomBudgetVal] = useState('');
  const [presetBudgetVal, setPresetBudgetVal] = useState('18-28 Lakhs');
  const [savingBudget, setSavingBudget] = useState(false);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('franchise_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setApps(data as App[]);
      } else {
        setApps(demo);
      }
    } catch {
      setApps(demo);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: App['status']) => {
    try {
      await supabase.from('franchise_applications').update({ status }).eq('id', id);
    } catch (e) {
      console.warn('Status update warning:', e);
    }
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const openBudgetEdit = (app: App) => {
    setEditingBudgetApp(app);
    if (app.budget.toLowerCase().includes('custom') || app.budget.startsWith('₹') && !app.budget.includes('–') && !app.budget.includes('-')) {
      setBudgetType('custom');
      setCustomBudgetVal(app.budget.replace(/Custom:\s*₹?|₹/g, ''));
    } else {
      setBudgetType('preset');
      setPresetBudgetVal(app.budget || '18-28 Lakhs');
      setCustomBudgetVal('');
    }
  };

  const handleSaveBudget = async () => {
    if (!editingBudgetApp) return;
    setSavingBudget(true);

    const newBudgetValue = budgetType === 'custom' 
      ? `Custom: ₹${customBudgetVal.trim() || '0'}` 
      : presetBudgetVal;

    try {
      await supabase
        .from('franchise_applications')
        .update({ budget: newBudgetValue })
        .eq('id', editingBudgetApp.id);
    } catch (e) {
      console.warn('Supabase budget update warning:', e);
    }

    setApps(prev => prev.map(a => a.id === editingBudgetApp.id ? { ...a, budget: newBudgetValue } : a));
    if (selected?.id === editingBudgetApp.id) {
      setSelected(prev => prev ? { ...prev, budget: newBudgetValue } : null);
    }

    setSavingBudget(false);
    setEditingBudgetApp(null);
  };

  const filteredApps = apps.filter(a => statusFilter === 'all' || a.status === statusFilter);

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', color: 'var(--color-plum)' }}>
          Franchise Applications & Investment Budgets
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          {apps.filter(a => a.status === 'pending').length} pending · {apps.filter(a => a.status === 'reviewing').length} under review
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="admin-tab-bar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px', marginBottom: 'var(--space-5)' }}>
        {[
          { id: 'all', label: `All (${apps.length})` },
          { id: 'pending', label: `Pending (${apps.filter(a => a.status === 'pending').length})` },
          { id: 'reviewing', label: `Reviewing (${apps.filter(a => a.status === 'reviewing').length})` },
          { id: 'approved', label: `Approved (${apps.filter(a => a.status === 'approved').length})` },
          { id: 'rejected', label: `Rejected (${apps.filter(a => a.status === 'rejected').length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setStatusFilter(t.id)}
            className={`btn btn-sm ${statusFilter === t.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap', padding: '7px 14px' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>City</th>
              <th>Investment Budget</th>
              <th>Experience</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <span className="spinner"></span>
                </td>
              </tr>
            ) : filteredApps.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                  No franchise applications found.
                </td>
              </tr>
            ) : (
              filteredApps.map(a => {
                const isCustom = a.budget?.toLowerCase().includes('custom');

                return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-plum)' }}>{a.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                          {formatIndianPhoneDisplay(a.phone) || a.phone}
                        </span>
                        <a
                          href={createWhatsAppUrl(a.phone, `Hello ${a.name}, thank you for your interest in the Thirst. franchise! Let's discuss your investment proposal.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Chat on WhatsApp"
                          style={{ color: '#25D366' }}
                        >
                          <MessageCircle size={14} />
                        </a>
                      </div>
                    </td>
                    <td>{a.city}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: isCustom ? 'var(--color-berry)' : 'var(--color-plum)' }}>
                            {a.budget}
                          </div>
                          {isCustom && (
                            <span style={{ fontSize: '0.7rem', background: 'rgba(217,79,138,0.12)', color: 'var(--color-berry)', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              Custom Budget
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => openBudgetEdit(a)}
                          className="btn btn-ghost btn-sm"
                          title="Edit Investment Budget"
                          style={{ padding: '4px 6px' }}
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{a.experience}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {new Date(a.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusColors[a.status]}`}>{a.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button onClick={() => setSelected(a)} className="btn btn-secondary btn-sm">
                          <Eye size={13} /> View
                        </button>
                        {a.status === 'pending' && (
                          <button onClick={() => updateStatus(a.id, 'reviewing')} className="btn btn-sm" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: 'none', borderRadius: 'var(--radius-full)', padding: '8px 12px', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.8125rem' }}>
                            Review
                          </button>
                        )}
                        {a.status === 'reviewing' && (
                          <>
                            <button onClick={() => updateStatus(a.id, 'approved')} title="Approve" style={{ padding: '8px', background: 'rgba(34,197,94,0.1)', color: 'var(--color-success)', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}>
                              <Check size={14} />
                            </button>
                            <button onClick={() => updateStatus(a.id, 'rejected')} title="Reject" style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}>
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT BUDGET MODAL */}
      {editingBudgetApp && (
        <div className="overlay" onClick={() => setEditingBudgetApp(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={20} style={{ color: 'var(--color-berry)' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.2rem' }}>
                  Edit Investment Budget
                </h3>
              </div>
              <button onClick={() => setEditingBudgetApp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>
              Applicant: <strong>{editingBudgetApp.name}</strong> ({editingBudgetApp.city})
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-4)' }}>
              <button
                type="button"
                onClick={() => setBudgetType('preset')}
                className={`btn btn-sm ${budgetType === 'preset' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Standard Range
              </button>
              <button
                type="button"
                onClick={() => setBudgetType('custom')}
                className={`btn btn-sm ${budgetType === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Custom Amount
              </button>
            </div>

            {budgetType === 'preset' ? (
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Select Franchise Model Tier
                </label>
                <select
                  className="input"
                  value={presetBudgetVal}
                  onChange={e => setPresetBudgetVal(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="8-12 Lakhs">₹8–12 Lakhs (Kiosk Model)</option>
                  <option value="18-28 Lakhs">₹18–28 Lakhs (Café Model)</option>
                  <option value="35-50 Lakhs">₹35–50 Lakhs (Flagship Boutique)</option>
                  <option value="50+ Lakhs">₹50+ Lakhs (Multi-Unit City Master)</option>
                </select>
              </div>
            ) : (
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Custom Investment Budget Amount
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ padding: '10px 14px', background: 'var(--color-plum)', color: 'white', fontWeight: 800, borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}>
                    ₹
                  </span>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 25,00,000 or 30 Lakhs"
                    value={customBudgetVal}
                    onChange={e => setCustomBudgetVal(e.target.value)}
                    style={{ flex: 1, borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingBudgetApp(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveBudget} disabled={savingBudget} className="btn btn-primary">
                {savingBudget ? 'Saving...' : <><Save size={16} /> Save Budget</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATION DETAILS MODAL */}
      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.25rem' }}>
                Application Details
              </h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {[
                ['Applicant Name', selected.name],
                ['Phone Number', formatIndianPhoneDisplay(selected.phone) || selected.phone],
                ['Email Address', selected.email],
                ['Target City', selected.city],
                ['Investment Budget', selected.budget],
                ['F&B Experience', selected.experience]
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--color-lavender)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase' }}>
                    {k}
                  </span>
                  <span style={{ color: 'var(--color-plum)', fontWeight: 600, textAlign: 'right' }}>
                    {v}
                  </span>
                </div>
              ))}

              {/* Direct WhatsApp Action */}
              <div style={{ paddingTop: '6px' }}>
                <a
                  href={createWhatsAppUrl(selected.phone, `Hi ${selected.name}, regarding your Thirst. franchise application in ${selected.city}:`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    background: '#25D366',
                    color: 'white',
                    width: '100%',
                    justifyContent: 'center',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageCircle size={18} /> Chat with Applicant on WhatsApp
                </a>
              </div>

              {/* Quick Budget Edit Action Button */}
              <button
                onClick={() => { const s = selected; setSelected(null); openBudgetEdit(s); }}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Edit3 size={15} /> Edit Investment Budget Amount
              </button>

              {selected.message && (
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Applicant Message / Remarks
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, background: 'var(--color-lavender)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                    {selected.message}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
                {selected.status !== 'approved' && (
                  <button onClick={() => updateStatus(selected.id, 'approved')} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                    <Check size={16} /> Approve
                  </button>
                )}
                {selected.status !== 'rejected' && (
                  <button onClick={() => updateStatus(selected.id, 'rejected')} className="btn" style={{ flex: 1, justifyContent: 'center', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-heading)', fontWeight: 700, cursor: 'pointer' }}>
                    <X size={16} /> Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
