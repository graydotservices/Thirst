'use client';

import { useState } from 'react';
import { Plus, MapPin, X, Check, Edit2, Trash2 } from 'lucide-react';

type Location = { id: string; name: string; address: string; city: string; phone: string; hours: string; isActive: boolean; };
const demo: Location[] = [
  { id: '1', name: 'Thirst. Bandra — Flagship', address: '12 Sweet Lane, Bandra West', city: 'Mumbai', phone: '+91 98765 43210', hours: '2:00 PM – 12:00 AM', isActive: true },
  { id: '2', name: 'Thirst. Andheri', address: '45 Versova Road, Andheri West', city: 'Mumbai', phone: '+91 98765 43211', hours: '2:00 PM – 12:00 AM', isActive: true },
  { id: '3', name: 'Thirst. Koramangala', address: '7th Block, Koramangala', city: 'Bangalore', phone: '+91 98765 43213', hours: '9:00 AM – 11:00 PM', isActive: false },
];

export default function AdminLocationsPage() {
  const [locs, setLocs] = useState<Location[]>(demo);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', hours: '', isActive: true });

  const handleSave = () => {
    if (editing) setLocs(prev => prev.map(l => l.id === editing.id ? { ...l, ...form } : l));
    else setLocs(prev => [...prev, { ...form, id: Date.now().toString() }]);
    setShowModal(false);
  };
  const openEdit = (l: Location) => { setEditing(l); setForm({ name: l.name, address: l.address, city: l.city, phone: l.phone, hours: l.hours, isActive: l.isActive }); setShowModal(true); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div><h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Store Locations</h1><p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{locs.filter(l => l.isActive).length} active locations</p></div>
        <button onClick={() => { setEditing(null); setForm({ name: '', address: '', city: '', phone: '', hours: '', isActive: true }); setShowModal(true); }} className="btn btn-primary"><Plus size={18} /> Add Location</button>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>Store Name</th><th>City</th><th>Address</th><th>Phone</th><th>Hours</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {locs.map(l => (
              <tr key={l.id}>
                <td style={{ fontWeight: 600, color: 'var(--color-plum)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={14} style={{ color: 'var(--color-berry)', flexShrink: 0 }} />{l.name}</div></td>
                <td>{l.city}</td>
                <td style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{l.address}</td>
                <td style={{ fontSize: '0.875rem' }}>{l.phone}</td>
                <td style={{ fontSize: '0.8125rem' }}>{l.hours}</td>
                <td><span className={`badge ${l.isActive ? 'badge-success' : 'badge-error'}`}>{l.isActive ? 'Active' : 'Inactive'}</span></td>
                <td><div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button onClick={() => openEdit(l)} className="btn btn-secondary btn-sm"><Edit2 size={13} /></button>
                  <button onClick={() => setLocs(prev => prev.filter(x => x.id !== l.id))} style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}><Trash2 size={13} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.25rem' }}>{editing ? 'Edit Location' : 'Add Location'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={22} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group"><label className="input-label" htmlFor="loc-name">Store Name</label><input id="loc-name" className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Store name" /></div>
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="input-group"><label className="input-label" htmlFor="loc-city">City</label><input id="loc-city" className="input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
                <div className="input-group"><label className="input-label" htmlFor="loc-phone">Phone</label><input id="loc-phone" className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <div className="input-group"><label className="input-label" htmlFor="loc-addr">Address</label><input id="loc-addr" className="input" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label" htmlFor="loc-hours">Business Hours</label><input id="loc-hours" className="input" value={form.hours} onChange={e => setForm(p => ({ ...p, hours: e.target.value }))} placeholder="2:00 PM – 12:00 AM" /></div>
              <div className="input-group"><label className="input-label" htmlFor="loc-status">Status</label><select id="loc-status" className="input" value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'active' }))}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}><Check size={16} /> {editing ? 'Update' : 'Add'}</button>
                <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
