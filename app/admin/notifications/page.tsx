'use client';

import { useState } from 'react';
import { Bell, Plus, X, Check, Trash2 } from 'lucide-react';

type Notif = { id: string; title: string; message: string; type: 'info' | 'success' | 'warning' | 'offer'; isActive: boolean; };
const demo: Notif[] = [
  { id: '1', title: 'Weekend Special Offer!', message: 'Buy 2 scoops and get 1 free this Saturday & Sunday!', type: 'offer', isActive: true },
  { id: '2', title: 'New Branch Opening', message: 'Thirst. is now open in Koramangala, Bangalore!', type: 'success', isActive: true },
  { id: '3', title: 'Temporary Closure', message: 'Bandra outlet closed for renovation on 30th July.', type: 'warning', isActive: false },
];

const typeColors = { info: '#6366f1', success: '#22c55e', warning: '#f59e0b', offer: 'var(--color-berry)' };
const typeBg = { info: 'rgba(99,102,241,0.1)', success: 'rgba(34,197,94,0.1)', warning: 'rgba(245,158,11,0.1)', offer: 'rgba(217,79,138,0.1)' };

export default function NotificationsAdminPage() {
  const [notifs, setNotifs] = useState<Notif[]>(demo);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info' as Notif['type'], isActive: true });

  const handleAdd = () => {
    setNotifs(prev => [...prev, { ...form, id: Date.now().toString() }]);
    setShowModal(false);
    setForm({ title: '', message: '', type: 'info', isActive: true });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div><h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Notifications</h1><p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Manage push & in-app notifications</p></div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus size={18} /> New Notification</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {notifs.map(n => (
          <div key={n.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', opacity: n.isActive ? 1 : 0.6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: typeBg[n.type], display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeColors[n.type], flexShrink: 0 }}>
              <Bell size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.9375rem' }}>{n.title}</h3>
                <span style={{ padding: '3px 12px', borderRadius: 'var(--radius-full)', background: typeBg[n.type], color: typeColors[n.type], fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize' }}>{n.type}</span>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{n.message}</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
              <button onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isActive: !x.isActive } : x))} style={{ padding: '7px 12px', borderRadius: 'var(--radius-full)', border: '1.5px solid', borderColor: n.isActive ? 'var(--color-success)' : 'var(--color-text-muted)', background: n.isActive ? 'rgba(34,197,94,0.1)' : 'transparent', color: n.isActive ? 'var(--color-success)' : 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                {n.isActive ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => setNotifs(prev => prev.filter(x => x.id !== n.id))} style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.25rem' }}>New Notification</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={22} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group"><label className="input-label" htmlFor="nt-title">Title</label><input id="nt-title" className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Notification title" /></div>
              <div className="input-group"><label className="input-label" htmlFor="nt-msg">Message</label><textarea id="nt-msg" className="input" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Notification content..." /></div>
              <div className="input-group"><label className="input-label" htmlFor="nt-type">Type</label>
                <select id="nt-type" className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as Notif['type'] }))}>
                  <option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="offer">Offer</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button onClick={handleAdd} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}><Check size={16} /> Publish</button>
                <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
