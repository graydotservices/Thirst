'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Clock, Percent } from 'lucide-react';
import Image from 'next/image';

type Offer = { id: string; title: string; description: string; discount: number; code: string; validUntil: string; isActive: boolean; };
const demo: Offer[] = [
  { id: '1', title: 'Birthday Special', description: 'Get 30% off on your birthday month', discount: 30, code: 'BDAY30', validUntil: 'Ongoing', isActive: true },
  { id: '2', title: 'Weekend Deal', description: 'Buy 2 get 1 free on ice creams', discount: 33, code: 'WEEKEND', validUntil: '2025-12-31', isActive: true },
  { id: '3', title: 'First Order', description: '20% off for new customers', discount: 20, code: 'FIRST20', validUntil: '2025-12-31', isActive: false },
];

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>(demo);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState({ title: '', description: '', discount: 0, code: '', validUntil: '', isActive: true });

  const handleSave = () => {
    if (editing) setOffers(prev => prev.map(o => o.id === editing.id ? { ...o, ...form } : o));
    else setOffers(prev => [...prev, { ...form, id: Date.now().toString() }]);
    setShowModal(false);
  };
  const openEdit = (o: Offer) => { setEditing(o); setForm({ title: o.title, description: o.description, discount: o.discount, code: o.code, validUntil: o.validUntil, isActive: o.isActive }); setShowModal(true); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div><h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Offers Manager</h1><p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{offers.filter(o => o.isActive).length} active offers</p></div>
        <button onClick={() => { setEditing(null); setForm({ title: '', description: '', discount: 0, code: '', validUntil: '', isActive: true }); setShowModal(true); }} className="btn btn-primary"><Plus size={18} /> New Offer</button>
      </div>
      <div className="grid grid-3">
        {offers.map(o => (
          <div key={o.id} className="card" style={{ padding: 'var(--space-5)', border: o.isActive ? '2px solid rgba(217,79,138,0.3)' : '1px solid var(--color-lavender-dark)', opacity: o.isActive ? 1 : 0.65 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '2.5rem', color: 'var(--color-plum)', lineHeight: 1 }}>{o.discount}%<span style={{ fontSize: '1rem', color: 'var(--color-berry)' }}>OFF</span></div>
              <button onClick={() => setOffers(prev => prev.map(x => x.id === o.id ? { ...x, isActive: !x.isActive } : x))} style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1.5px solid', borderColor: o.isActive ? 'var(--color-success)' : 'var(--color-text-muted)', background: o.isActive ? 'rgba(34,197,94,0.1)' : 'transparent', color: o.isActive ? 'var(--color-success)' : 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                {o.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px', fontSize: '1rem' }}>{o.title}</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-3)', lineHeight: 1.6 }}>{o.description}</p>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-berry)', background: 'rgba(217,79,138,0.1)', padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-berry)', display: 'inline-block', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>{o.code}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginBottom: 'var(--space-4)' }}>
              <Clock size={13} />{o.validUntil}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button onClick={() => openEdit(o)} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}><Edit2 size={13} /> Edit</button>
              <button onClick={() => setOffers(prev => prev.filter(x => x.id !== o.id))} style={{ padding: '8px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.25rem' }}>{editing ? 'Edit Offer' : 'New Offer'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={22} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group"><label className="input-label" htmlFor="of-title">Title</label><input id="of-title" className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Offer title" /></div>
              <div className="input-group"><label className="input-label" htmlFor="of-desc">Description</label><textarea id="of-desc" className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" /></div>
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="input-group"><label className="input-label" htmlFor="of-disc">Discount %</label><input id="of-disc" type="number" className="input" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: Number(e.target.value) }))} /></div>
                <div className="input-group"><label className="input-label" htmlFor="of-code">Promo Code</label><input id="of-code" className="input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="CODE" /></div>
                <div className="input-group"><label className="input-label" htmlFor="of-valid">Valid Until</label><input id="of-valid" className="input" value={form.validUntil} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))} placeholder="e.g. Dec 31, 2025" /></div>
                <div className="input-group"><label className="input-label" htmlFor="of-active">Status</label><select id="of-active" className="input" value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'active' }))}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}><Check size={16} /> {editing ? 'Update' : 'Create'}</button>
                <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
