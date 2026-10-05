'use client';

import { useState, useEffect } from 'react';
import { Plus, MapPin, X, Check, Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Location = { 
  id: string; 
  name: string; 
  address: string; 
  city: string; 
  phone: string; 
  hours: string; 
  isActive: boolean; 
};

const defaultDemo: Location[] = [
  { id: '1', name: 'Thirst. Bandra — Flagship', address: '12 Sweet Lane, Bandra West', city: 'Mumbai', phone: '+91 98765 43210', hours: '2:00 PM – 12:00 AM', isActive: true },
  { id: '2', name: 'Thirst. Andheri', address: '45 Versova Road, Andheri West', city: 'Mumbai', phone: '+91 98765 43211', hours: '2:00 PM – 12:00 AM', isActive: true },
  { id: '3', name: 'Thirst. Koramangala', address: '7th Block, Koramangala', city: 'Bangalore', phone: '+91 98765 43213', hours: '9:00 AM – 11:00 PM', isActive: false },
];

export default function AdminLocationsPage() {
  const [locs, setLocs] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({ name: '', address: '', city: 'Mumbai', phone: '', hours: '12:00 PM – 12:00 AM', isActive: true });

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setLocs(defaultDemo);
      } else {
        const mapped = data.map((l: any) => ({
          id: l.id,
          name: l.name || '',
          address: l.address || '',
          city: l.city || '',
          phone: l.phone || '',
          hours: l.hours || '',
          isActive: l.is_active ?? true,
        }));
        setLocs(mapped);
      }
    } catch {
      setLocs(defaultDemo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!form.name.trim()) {
      setErrorMessage('Please enter store name.');
      return;
    }
    if (!form.address.trim()) {
      setErrorMessage('Please enter store address.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
        hours: form.hours.trim(),
        is_active: form.isActive,
      };

      if (editing) {
        const { error } = await supabase
          .from('store_locations')
          .update(payload)
          .eq('id', editing.id);

        if (error) {
          console.warn('Supabase store_locations update warning:', error.message);
        }

        setLocs(prev => prev.map(l => l.id === editing.id ? { ...l, ...form } : l));
      } else {
        const { data, error } = await supabase
          .from('store_locations')
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.warn('Supabase store_locations insert warning, saving locally:', error.message);
          setLocs(prev => [{ ...form, id: Date.now().toString() }, ...prev]);
        } else if (data) {
          setLocs(prev => [{
            id: data.id,
            name: data.name,
            address: data.address,
            city: data.city,
            phone: data.phone || '',
            hours: data.hours || '',
            isActive: data.is_active ?? true,
          }, ...prev]);
        }
      }

      setShowModal(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save location.');
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setErrorMessage('');
    setForm({ name: '', address: '', city: 'Mumbai', phone: '', hours: '12:00 PM – 12:00 AM', isActive: true });
    setShowModal(true);
  };

  const openEdit = (l: Location) => {
    setEditing(l);
    setErrorMessage('');
    setForm({ name: l.name, address: l.address, city: l.city, phone: l.phone, hours: l.hours, isActive: l.isActive });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this store location?')) {
      setLocs(prev => prev.filter(x => x.id !== id));
      try {
        await supabase.from('store_locations').delete().eq('id', id);
      } catch (e) {
        console.warn('Failed to delete store location from Supabase', e);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Store Locations</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{locs.filter(l => l.isActive).length} active cafe & dessert branches</p>
        </div>
        <button id="btn-add-location" onClick={openAdd} className="btn btn-primary">
          <Plus size={18} /> Add Location
        </button>
      </div>

      <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ minWidth: 650 }}>
          <thead>
            <tr>
              <th>Store Name</th>
              <th>City</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Hours</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 size={18} className="animate-spin" /> Loading locations...
                  </div>
                </td>
              </tr>
            ) : locs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                  No store locations found. Add your first outlet!
                </td>
              </tr>
            ) : (
              locs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-plum)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} style={{ color: 'var(--color-berry)', flexShrink: 0 }} />
                      {l.name}
                    </div>
                  </td>
                  <td>{l.city}</td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{l.address}</td>
                  <td style={{ fontSize: '0.875rem' }}>
                    {l.phone ? <a href={`tel:${l.phone}`} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>{l.phone}</a> : '—'}
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>{l.hours || '—'}</td>
                  <td>
                    <span className={`badge ${l.isActive ? 'badge-success' : 'badge-error'}`}>
                      {l.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button onClick={() => openEdit(l)} title="Edit location" className="btn btn-secondary btn-sm">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(l.id)} title="Delete location" style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.25rem' }}>
                {editing ? 'Edit Location' : 'Add Location'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={22} /></button>
            </div>

            {errorMessage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="loc-name">Store Name *</label>
                <input id="loc-name" required className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Thirst. Bandra — Flagship" />
              </div>
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="loc-city">City *</label>
                  <input id="loc-city" required className="input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Mumbai" />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="loc-phone">Phone</label>
                  <input id="loc-phone" type="tel" inputMode="tel" className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="loc-addr">Full Address *</label>
                <input id="loc-addr" required className="input" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Street, Area, Landmark" />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="loc-hours">Business Hours</label>
                <input id="loc-hours" className="input" value={form.hours} onChange={e => setForm(p => ({ ...p, hours: e.target.value }))} placeholder="e.g. 12:00 PM – 12:00 AM" />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="loc-status">Operational Status</label>
                <select id="loc-status" className="input" value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'active' }))}>
                  <option value="active">Active (Open)</option>
                  <option value="inactive">Inactive (Closed / Renovation)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? 'Saving...' : <><Check size={16} /> {editing ? 'Update Location' : 'Add Location'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

