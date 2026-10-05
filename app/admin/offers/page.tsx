'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Clock, Percent, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Offer = {
  id: string;
  title: string;
  description: string;
  discount: number;
  code: string;
  validUntil: string;
  isActive: boolean;
};

const defaultDemo: Offer[] = [
  { id: '1', title: 'Birthday Special', description: 'Get 30% off on your birthday month', discount: 30, code: 'BDAY30', validUntil: '2026-12-31', isActive: true },
  { id: '2', title: 'Weekend Deal', description: 'Buy 2 get 1 free on ice creams', discount: 33, code: 'WEEKEND', validUntil: '2026-12-31', isActive: true },
  { id: '3', title: 'First Order', description: '20% off for new customers', discount: 20, code: 'FIRST20', validUntil: '2026-12-31', isActive: false },
];

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', discount: 10, code: '', validUntil: '', isActive: true });

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        // Fallback to default demo offers if table empty
        setOffers(defaultDemo);
      } else {
        const mapped = data.map((o: any) => ({
          id: o.id,
          title: o.title || '',
          description: o.description || '',
          discount: o.discount_percentage ?? o.discount ?? 0,
          code: o.code || '',
          validUntil: o.valid_until ? o.valid_until.split('T')[0] : 'Ongoing',
          isActive: o.is_active ?? true,
        }));
        setOffers(mapped);
      }
    } catch {
      setOffers(defaultDemo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleToggleActive = async (o: Offer) => {
    const nextState = !o.isActive;
    setOffers(prev => prev.map(x => x.id === o.id ? { ...x, isActive: nextState } : x));

    try {
      await supabase
        .from('offers')
        .update({ is_active: nextState })
        .eq('id', o.id);
    } catch (e) {
      console.warn('Failed to update offer status in Supabase', e);
    }
  };

  const handleSave = async () => {
    setErrorMessage('');
    if (!form.title.trim()) {
      setErrorMessage('Please enter an offer title.');
      return;
    }
    if (!form.code.trim()) {
      setErrorMessage('Please enter a promo code.');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: form.title.trim(),
        description: form.description.trim(),
        discount_percentage: Number(form.discount) || 0,
        code: form.code.trim().toUpperCase(),
        valid_until: form.validUntil || null,
        is_active: form.isActive,
      };

      if (editing) {
        const { error } = await supabase
          .from('offers')
          .update(payload)
          .eq('id', editing.id);

        if (error) {
          console.warn('Supabase update offer warning:', error.message);
        }

        setOffers(prev => prev.map(o => o.id === editing.id ? {
          ...o,
          title: form.title,
          description: form.description,
          discount: form.discount,
          code: form.code.toUpperCase(),
          validUntil: form.validUntil || 'Ongoing',
          isActive: form.isActive
        } : o));
      } else {
        const { data, error } = await supabase
          .from('offers')
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert offer warning:', error.message);
          // Local add fallback
          const newLocal: Offer = {
            id: Date.now().toString(),
            title: form.title,
            description: form.description,
            discount: form.discount,
            code: form.code.toUpperCase(),
            validUntil: form.validUntil || 'Ongoing',
            isActive: form.isActive,
          };
          setOffers(prev => [newLocal, ...prev]);
        } else if (data) {
          const newOffer: Offer = {
            id: data.id,
            title: data.title,
            description: data.description || '',
            discount: data.discount_percentage ?? form.discount,
            code: data.code,
            validUntil: data.valid_until ? data.valid_until.split('T')[0] : 'Ongoing',
            isActive: data.is_active ?? true,
          };
          setOffers(prev => [newOffer, ...prev]);
        }
      }
      setShowModal(false);
    } catch (e: any) {
      setErrorMessage(e?.message || 'Error saving offer.');
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setErrorMessage('');
    setForm({ title: '', description: '', discount: 15, code: '', validUntil: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (o: Offer) => {
    setEditing(o);
    setErrorMessage('');
    setForm({
      title: o.title,
      description: o.description,
      discount: o.discount,
      code: o.code,
      validUntil: o.validUntil === 'Ongoing' ? '' : o.validUntil,
      isActive: o.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this promo offer?')) {
      setOffers(prev => prev.filter(x => x.id !== id));
      try {
        await supabase.from('offers').delete().eq('id', id);
      } catch (e) {
        console.warn('Failed to delete offer from Supabase', e);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Offers & Discounts</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{offers.filter(o => o.isActive).length} active promotional offers</p>
        </div>
        <button id="btn-add-offer" onClick={openAdd} className="btn btn-primary">
          <Plus size={18} /> New Offer
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh', color: 'var(--color-text-muted)' }}>
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : offers.length === 0 ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
          No offers found. Create your first promotional deal!
        </div>
      ) : (
        <div className="grid grid-3" style={{ gap: 'var(--space-4)' }}>
          {offers.map(o => (
            <div key={o.id} className="card" style={{ padding: 'var(--space-5)', border: o.isActive ? '2px solid rgba(217,79,138,0.3)' : '1px solid var(--color-lavender-dark)', opacity: o.isActive ? 1 : 0.65, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '2.5rem', color: 'var(--color-plum)', lineHeight: 1 }}>
                  {o.discount}%<span style={{ fontSize: '1rem', color: 'var(--color-berry)' }}> OFF</span>
                </div>
                <button 
                  onClick={() => handleToggleActive(o)} 
                  style={{ 
                    padding: '6px 14px', 
                    borderRadius: 'var(--radius-full)', 
                    border: '1.5px solid', 
                    borderColor: o.isActive ? 'var(--color-success)' : 'var(--color-text-muted)', 
                    background: o.isActive ? 'rgba(34,197,94,0.1)' : 'transparent', 
                    color: o.isActive ? 'var(--color-success)' : 'var(--color-text-muted)', 
                    fontFamily: 'var(--font-heading)', 
                    fontWeight: 600, 
                    fontSize: '0.8125rem', 
                    cursor: 'pointer' 
                  }}
                >
                  {o.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px', fontSize: '1rem' }}>{o.title}</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-3)', lineHeight: 1.6, flex: 1 }}>{o.description}</p>
              
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(o.code);
                    setCopiedCode(o.code);
                    setTimeout(() => setCopiedCode(null), 2000);
                  }}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    color: 'var(--color-berry)',
                    background: copiedCode === o.code ? 'rgba(34,197,94,0.15)' : 'rgba(217,79,138,0.1)',
                    borderColor: copiedCode === o.code ? 'var(--color-success)' : 'var(--color-berry)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed',
                    display: 'inline-block',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    transition: 'all 0.2s ease',
                  }}
                  title="Click to copy promo code"
                >
                  {copiedCode === o.code ? '✓ COPIED!' : o.code}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginBottom: 'var(--space-4)' }}>
                <Clock size={13} /> Valid: {o.validUntil}
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button onClick={() => openEdit(o)} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                  <Edit2 size={13} /> Edit
                </button>
                <button onClick={() => handleDelete(o.id)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.25rem' }}>
                {editing ? 'Edit Offer' : 'New Offer'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={22} />
              </button>
            </div>

            {errorMessage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="of-title">Offer Title *</label>
                <input id="of-title" className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Summer Weekend Treat" />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="of-desc">Description</label>
                <textarea id="of-desc" className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short offer description" rows={2} />
              </div>
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="of-disc">Discount %</label>
                  <input id="of-disc" type="number" min="1" max="100" className="input" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: Number(e.target.value) }))} />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="of-code">Promo Code *</label>
                  <input id="of-code" className="input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SUMMER25" />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="of-valid">Valid Until Date</label>
                  <input id="of-valid" type="date" className="input" value={form.validUntil} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="of-active">Status</label>
                  <select id="of-active" className="input" value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'active' }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? 'Saving...' : <><Check size={16} /> {editing ? 'Update Offer' : 'Create Offer'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

