'use client';

import { useState } from 'react';
import { UserPlus, Search, Edit2, Trash2, X, Check } from 'lucide-react';

type Staff = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  status: 'active' | 'inactive';
};

const demoStaff: Staff[] = [
  { id: '1', name: 'Aryan Kapoor', phone: '9876543210', email: 'aryan@thirstcafe.in', role: 'admin', status: 'active' },
  { id: '2', name: 'Priya Nair', phone: '9876543211', email: 'priya@thirstcafe.in', role: 'manager', status: 'active' },
  { id: '3', name: 'Rohit Sharma', phone: '9876543212', email: 'rohit@thirstcafe.in', role: 'cashier', status: 'active' },
  { id: '4', name: 'Ananya Desai', phone: '9876543213', email: 'ananya@thirstcafe.in', role: 'cashier', status: 'inactive' },
];

const roleColors: Record<string, string> = { admin: 'badge-dark', manager: 'badge-primary', cashier: 'badge-gold' };

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>(demoStaff);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'cashier' as Staff['role'], status: 'active' as Staff['status'] });

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    s.role.includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm({ name: '', phone: '', email: '', role: 'cashier', status: 'active' }); setShowModal(true); };
  const openEdit = (s: Staff) => { setEditing(s); setForm({ name: s.name, phone: s.phone, email: s.email, role: s.role, status: s.status }); setShowModal(true); };

  const handleSave = () => {
    if (editing) {
      setStaff(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
    } else {
      setStaff(prev => [...prev, { ...form, id: Date.now().toString() }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Remove this staff member?')) setStaff(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Staff Management</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{staff.filter(s => s.status === 'active').length} active staff members</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary"><UserPlus size={18} /> Add Staff</button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-5)', maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input id="staff-search" className="input" placeholder="Search by name, phone, role..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 44, background: 'white' }} />
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr><th>Name</th><th>Phone</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                      {s.name[0]}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{s.name}</span>
                  </div>
                </td>
                <td>{s.phone}</td>
                <td>{s.email}</td>
                <td><span className={`badge ${roleColors[s.role]}`}>{s.role}</span></td>
                <td>
                  <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                    {s.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button onClick={() => openEdit(s)} className="btn btn-secondary btn-sm"><Edit2 size={14} /> Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', borderRadius: 'var(--radius-full)', padding: '8px 14px', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.25rem' }}>
                {editing ? 'Edit Staff Member' : 'Add New Staff'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={22} /></button>
            </div>
            <div className="grid grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="sm-name">Full Name</label>
                <input id="sm-name" className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Staff name" />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="sm-phone">Phone</label>
                <input id="sm-phone" className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="sm-email">Email</label>
                <input id="sm-email" className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email address" />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="sm-role">Role</label>
                <select id="sm-role" className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as Staff['role'] }))}>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
              <label className="input-label" htmlFor="sm-status">Status</label>
              <select id="sm-status" className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Staff['status'] }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                <Check size={16} /> {editing ? 'Update' : 'Add Staff'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
