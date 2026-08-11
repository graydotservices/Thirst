'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Staff = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  status: 'active' | 'inactive';
};

const roleColors: Record<string, string> = { admin: 'badge-dark', manager: 'badge-primary', cashier: 'badge-gold' };

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'cashier' as Staff['role'], status: 'active' as Staff['status'], password: '' });
  const [saving, setSaving] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    const { data } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
    if (data) setStaff(data as Staff[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filtered = staff.filter(s =>
    (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
    (s.phone && s.phone.includes(search)) ||
    (s.role && s.role.includes(search.toLowerCase()))
  );

  const openAdd = () => { setEditing(null); setForm({ name: '', phone: '', email: '', role: 'cashier', status: 'active', password: '' }); setError(''); setShowModal(true); };
  const openEdit = (s: Staff) => { setEditing(s); setForm({ name: s.name, phone: s.phone || '', email: s.email, role: s.role, status: s.status, password: '' }); setError(''); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    if (editing) {
      // Update
      const { error: updateError } = await supabase
        .from('staff')
        .update({ name: form.name, phone: form.phone, role: form.role, status: form.status })
        .eq('id', editing.id);
      
      if (updateError) {
        setError(updateError.message);
      } else {
        setStaff(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
        setShowModal(false);
      }
    } else {
      // Add new
      if (!form.password) {
        setError('Password is required for new staff');
        setSaving(false);
        return;
      }
      
      try {
        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Failed to create auth account');
        } else {
          // Now insert into database using the authenticated admin's session
          const { data: staffData, error: staffError } = await supabase
            .from('staff')
            .insert([{ id: data.userId, name: form.name, phone: form.phone, email: form.email, role: form.role, status: form.status }])
            .select()
            .single();

          if (staffError) {
            setError(staffError.message);
          } else if (staffData) {
            setStaff(prev => [staffData as Staff, ...prev]);
            setShowModal(false);
          }
        }
      } catch (err) {
        setError('Network error');
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Remove this staff member? This cannot be undone.')) {
      await supabase.from('staff').delete().eq('id', id);
      setStaff(prev => prev.filter(s => s.id !== id));
    }
  };

  const testInsert = async () => {
    const { data, error } = await supabase.from('staff').insert([{
      name: 'Test Staff', phone: '1234567890', email: 'test@example.com', role: 'cashier', status: 'active'
    }]);
    if (error) {
      alert(`Test insert error: ${JSON.stringify(error)}`);
    } else {
      alert('Test insert success!');
    }
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
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>No staff found.</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                      {s.name[0]}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{s.name}</span>
                  </div>
                </td>
                <td>{s.phone || '-'}</td>
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
                    {s.role !== 'admin' && (
                      <button onClick={() => handleDelete(s.id)} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', borderRadius: 'var(--radius-full)', padding: '8px 14px', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
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
                <input id="sm-email" className="input" type="email" disabled={!!editing} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email address" />
              </div>
              {!editing && (
                <div className="input-group">
                  <label className="input-label" htmlFor="sm-password">Initial Password</label>
                  <input id="sm-password" type="password" className="input" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Create password" />
                </div>
              )}
              <div className="input-group">
                <label className="input-label" htmlFor="sm-role">Role</label>
                <select id="sm-role" className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as Staff['role'] }))}>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>
            </div>
            
            {error && <div style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>{error}</div>}
            
            <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
              <label className="input-label" htmlFor="sm-status">Status</label>
              <select id="sm-status" className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Staff['status'] }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                <Check size={16} /> {saving ? 'Saving...' : (editing ? 'Update' : 'Add Staff')}
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
