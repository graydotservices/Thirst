'use client';

import { useState, useEffect } from 'react';
import { Bell, Plus, X, Check, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Notif = { 
  id: string; 
  title: string; 
  message: string; 
  type: 'info' | 'success' | 'warning' | 'offer'; 
  isActive: boolean; 
  createdAt?: string;
};

const defaultDemo: Notif[] = [
  { id: '1', title: 'Weekend Special Offer!', message: 'Buy 2 scoops and get 1 free this Saturday & Sunday!', type: 'offer', isActive: true },
  { id: '2', title: 'New Branch Opening', message: 'Thirst. is now open in Koramangala, Bangalore!', type: 'success', isActive: true },
  { id: '3', title: 'Temporary Closure', message: 'Bandra outlet closed for renovation on 30th July.', type: 'warning', isActive: false },
];

const typeColors = { info: '#6366f1', success: '#22c55e', warning: '#f59e0b', offer: 'var(--color-berry)' };
const typeBg = { info: 'rgba(99,102,241,0.1)', success: 'rgba(34,197,94,0.1)', warning: 'rgba(245,158,11,0.1)', offer: 'rgba(217,79,138,0.1)' };

export default function NotificationsAdminPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({ title: '', message: '', type: 'info' as Notif['type'], isActive: true });

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setNotifs(defaultDemo);
      } else {
        const mapped = data.map((n: any) => ({
          id: n.id,
          title: n.title || '',
          message: n.message || '',
          type: (['info', 'success', 'warning', 'offer'].includes(n.type) ? n.type : 'info') as Notif['type'],
          isActive: n.is_active ?? true,
          createdAt: n.created_at,
        }));
        setNotifs(mapped);
      }
    } catch {
      setNotifs(defaultDemo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleToggle = async (n: Notif) => {
    const nextState = !n.isActive;
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isActive: nextState } : x));
    try {
      await supabase.from('notifications').update({ is_active: nextState }).eq('id', n.id);
    } catch (e) {
      console.warn('Failed to update notification in Supabase', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this notification?')) {
      setNotifs(prev => prev.filter(x => x.id !== id));
      try {
        await supabase.from('notifications').delete().eq('id', id);
      } catch (e) {
        console.warn('Failed to delete notification from Supabase', e);
      }
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!form.title.trim()) {
      setErrorMessage('Please enter a notification title.');
      return;
    }
    if (!form.message.trim()) {
      setErrorMessage('Please enter notification content.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        is_active: form.isActive,
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn('Supabase notification insert warning, saving locally:', error.message);
        setNotifs(prev => [{ ...form, id: Date.now().toString() }, ...prev]);
      } else if (data) {
        setNotifs(prev => [{
          id: data.id,
          title: data.title,
          message: data.message || '',
          type: (data.type as Notif['type']) || 'info',
          isActive: data.is_active ?? true,
          createdAt: data.created_at,
        }, ...prev]);
      }

      setShowModal(false);
      setForm({ title: '', message: '', type: 'info', isActive: true });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to publish notification.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Notifications</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Broadcast customer & banner announcements</p>
        </div>
        <button id="btn-add-notif" onClick={() => { setErrorMessage(''); setShowModal(true); }} className="btn btn-primary">
          <Plus size={18} /> New Notification
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh', color: 'var(--color-text-muted)' }}>
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : notifs.length === 0 ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
          No active announcements. Create your first broadcast message!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {notifs.map(n => (
            <div key={n.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', opacity: n.isActive ? 1 : 0.6, flexWrap: 'wrap' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: typeBg[n.type] || 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeColors[n.type] || '#6366f1', flexShrink: 0 }}>
                <Bell size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.9375rem' }}>{n.title}</h3>
                  <span style={{ padding: '3px 12px', borderRadius: 'var(--radius-full)', background: typeBg[n.type] || 'rgba(99,102,241,0.1)', color: typeColors[n.type] || '#6366f1', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize' }}>
                    {n.type}
                  </span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{n.message}</p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0, alignItems: 'center' }}>
                <button 
                  onClick={() => handleToggle(n)} 
                  style={{ 
                    padding: '7px 14px', 
                    borderRadius: 'var(--radius-full)', 
                    border: '1.5px solid', 
                    borderColor: n.isActive ? 'var(--color-success)' : 'var(--color-text-muted)', 
                    background: n.isActive ? 'rgba(34,197,94,0.1)' : 'transparent', 
                    color: n.isActive ? 'var(--color-success)' : 'var(--color-text-muted)', 
                    fontFamily: 'var(--font-heading)', 
                    fontWeight: 600, 
                    fontSize: '0.8125rem', 
                    cursor: 'pointer' 
                  }}
                >
                  {n.isActive ? 'Active' : 'Inactive'}
                </button>
                <button 
                  onClick={() => handleDelete(n.id)} 
                  title="Delete notification"
                  style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.25rem' }}>New Notification</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={22} /></button>
            </div>

            {errorMessage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="nt-title">Title *</label>
                <input id="nt-title" required className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Diwali Festivity Offers Live!" />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="nt-msg">Message *</label>
                <textarea id="nt-msg" required rows={3} className="input" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Notification content for customers and staff..." />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="nt-type">Category Type</label>
                <select id="nt-type" className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as Notif['type'] }))}>
                  <option value="info">Information (Blue)</option>
                  <option value="success">Success / Opening (Green)</option>
                  <option value="warning">Notice / Closure (Amber)</option>
                  <option value="offer">Promotional Offer (Berry)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? 'Publishing...' : <><Check size={16} /> Publish Notification</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

