'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  MapPin, 
  X, 
  Check, 
  Edit2, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Building2, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Save, 
  Sparkles,
  ExternalLink,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { 
  useCompanySettings, 
  saveCompanySettings, 
  CompanySettings, 
  getFormattedAddress, 
  formatIndianPhoneDisplay 
} from '@/lib/companySettings';
import { 
  useStoreLocations, 
  StoreLocation 
} from '@/lib/storeLocations';

export default function AdminLocationsPage() {
  const [activeTab, setActiveTab] = useState<'outlets' | 'company'>('outlets');

  // Branch Outlets State via reactive hook
  const { locations: locs, loading: loadingLocs, saveLocation, removeLocation } = useStoreLocations();
  const [savingLoc, setSavingLoc] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<StoreLocation | null>(null);
  const [locSuccessMsg, setLocSuccessMsg] = useState('');
  const [locErrorMessage, setLocErrorMessage] = useState('');
  const [locForm, setLocForm] = useState({ 
    id: '',
    name: '', 
    address: '', 
    city: 'Chennai', 
    phone: '+91 87548 81546', 
    hours: '2:00 PM – 12:00 AM', 
    map_url: '',
    is_flagship: false,
    is_active: true 
  });

  // Company Settings State
  const { settings, loading: settingsLoading, reload: reloadSettings } = useCompanySettings();
  const [companyForm, setCompanyForm] = useState<CompanySettings>(settings);
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySuccessMsg, setCompanySuccessMsg] = useState('');
  const [companyErrorMsg, setCompanyErrorMsg] = useState('');

  // Synchronize company form with settings hook
  useEffect(() => {
    if (settings) {
      setCompanyForm(settings);
    }
  }, [settings]);

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySuccessMsg('');
    setCompanyErrorMsg('');
    setSavingCompany(true);

    try {
      const res = await saveCompanySettings(companyForm);
      if (res.success) {
        setCompanySuccessMsg('Company address & profile updated successfully! Changes are live across website footer, contact page, store locations, and billing receipts.');
        await reloadSettings();
        setTimeout(() => setCompanySuccessMsg(''), 6000);
      } else {
        setCompanyErrorMsg(res.error || 'Failed to update company settings');
      }
    } catch (err: unknown) {
      setCompanyErrorMsg((err instanceof Error ? err.message : '') || 'Unexpected error occurred');
    } finally {
      setSavingCompany(false);
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocErrorMessage('');
    if (!locForm.name.trim()) {
      setLocErrorMessage('Please enter store name.');
      return;
    }
    if (!locForm.address.trim()) {
      setLocErrorMessage('Please enter store address.');
      return;
    }
    if (!locForm.city.trim()) {
      setLocErrorMessage('Please enter city name.');
      return;
    }

    setSavingLoc(true);
    try {
      const payload = {
        id: editingLoc ? editingLoc.id : undefined,
        name: locForm.name.trim(),
        address: locForm.address.trim(),
        city: locForm.city.trim(),
        phone: locForm.phone.trim(),
        hours: locForm.hours.trim(),
        map_url: locForm.map_url.trim(),
        is_flagship: locForm.is_flagship,
        is_active: locForm.is_active,
      };

      const res = await saveLocation(payload);
      if (res.success) {
        setLocSuccessMsg(editingLoc ? 'Location updated successfully!' : 'New branch location added successfully!');
        setShowLocModal(false);
        setTimeout(() => setLocSuccessMsg(''), 5000);
      } else {
        setLocErrorMessage(res.error || 'Failed to save location.');
      }
    } catch (err: unknown) {
      setLocErrorMessage((err instanceof Error ? err.message : '') || 'Failed to save location.');
    } finally {
      setSavingLoc(false);
    }
  };

  const openAddLoc = () => {
    setEditingLoc(null);
    setLocErrorMessage('');
    setLocForm({ 
      id: '',
      name: '', 
      address: '', 
      city: 'Chennai', 
      phone: companyForm.phone || '+91 87548 81546', 
      hours: '2:00 PM – 12:00 AM', 
      map_url: '',
      is_flagship: false,
      is_active: true 
    });
    setShowLocModal(true);
  };

  const openEditLoc = (l: StoreLocation) => {
    setEditingLoc(l);
    setLocErrorMessage('');
    setLocForm({ 
      id: l.id,
      name: l.name, 
      address: l.address, 
      city: l.city, 
      phone: l.phone, 
      hours: l.hours, 
      map_url: l.map_url || '',
      is_flagship: l.is_flagship ?? false,
      is_active: l.is_active 
    });
    setShowLocModal(true);
  };

  const handleDeleteLoc = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete branch "${name}"? It will be removed from the public website.`)) return;
    const res = await removeLocation(id);
    if (res.success) {
      setLocSuccessMsg(`Branch "${name}" was removed.`);
      setTimeout(() => setLocSuccessMsg(''), 4000);
    } else {
      alert(res.error || 'Unable to delete this location.');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(217, 79, 138, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-berry)' }}>
              <MapPin size={20} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.65rem', color: 'var(--color-plum)', margin: 0 }}>
              Store Locations & Branches
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Manage all retail store branches, new city outlets, and official company flagship address.
          </p>
        </div>

        {/* Top actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            href="/store-locations"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-lavender)',
              color: 'var(--color-plum)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <ExternalLink size={16} />
            <span>View Public Store Locations</span>
          </Link>

          {activeTab === 'outlets' && (
            <button
              onClick={openAddLoc}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.875rem', fontWeight: 700 }}
            >
              <Plus size={18} /> Add New Branch
            </button>
          )}
        </div>
      </div>

      {/* Global Success / Alert messages */}
      {locSuccessMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', color: '#166534', fontSize: '0.875rem', marginBottom: '20px' }}>
          <CheckCircle2 size={18} />
          <span>{locSuccessMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '28px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('outlets')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '0.95rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'outlets' ? '3px solid var(--color-berry)' : '3px solid transparent',
            color: activeTab === 'outlets' ? 'var(--color-berry)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <MapPin size={17} />
          <span>Branch Locations</span>
          <span style={{
            fontSize: '0.75rem',
            padding: '2px 8px',
            borderRadius: '999px',
            background: activeTab === 'outlets' ? 'rgba(217, 79, 138, 0.15)' : '#e2e8f0',
            color: activeTab === 'outlets' ? 'var(--color-berry)' : '#64748b',
            fontWeight: 800
          }}>
            {locs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('company')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '0.95rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'company' ? '3px solid var(--color-berry)' : '3px solid transparent',
            color: activeTab === 'company' ? 'var(--color-berry)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Building2 size={17} />
          <span>Company Address & HQ</span>
        </button>
      </div>

      {/* TAB 1: BRANCH LOCATIONS & OUTLETS */}
      {activeTab === 'outlets' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              All branches listed below appear automatically on the public <Link href="/store-locations" target="_blank" style={{ color: 'var(--color-berry)', fontWeight: 600 }}>/store-locations</Link> directory.
            </div>
            <button
              onClick={openAddLoc}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Add Location
            </button>
          </div>

          <div className="table-container" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: 'var(--color-plum)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 18px' }}>Store Name</th>
                  <th style={{ padding: '14px 18px' }}>City</th>
                  <th style={{ padding: '14px 18px' }}>Address</th>
                  <th style={{ padding: '14px 18px' }}>Phone</th>
                  <th style={{ padding: '14px 18px' }}>Hours</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingLocs ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Loader2 size={18} className="animate-spin" /> Loading locations...
                      </div>
                    </td>
                  </tr>
                ) : locs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                      <MapPin size={36} color="var(--color-berry)" style={{ marginBottom: 10, opacity: 0.7 }} />
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-plum)' }}>No Branch Outlets Added Yet</div>
                      <div style={{ fontSize: '0.85rem', marginTop: 4, marginBottom: 16 }}>Click &quot;Add New Branch&quot; to add your first branch location.</div>
                      <button onClick={openAddLoc} className="btn btn-primary btn-sm">
                        <Plus size={15} /> Add First Branch
                      </button>
                    </td>
                  </tr>
                ) : (
                  locs.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '16px 18px', fontWeight: 700, color: 'var(--color-plum)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={16} style={{ color: 'var(--color-berry)', flexShrink: 0 }} />
                          <span>{l.name}</span>
                          {l.is_flagship && (
                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '50px', background: 'var(--color-berry)', color: 'white', fontWeight: 800, textTransform: 'uppercase' }}>
                              Flagship
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 18px', fontWeight: 600, color: 'var(--color-plum)' }}>
                        {l.city}
                      </td>
                      <td style={{ padding: '16px 18px', fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: 280 }}>
                        {l.address}
                      </td>
                      <td style={{ padding: '16px 18px', fontSize: '0.875rem' }}>
                        {l.phone ? (
                          <a href={`tel:${l.phone.replace(/\s+/g, '')}`} style={{ color: 'var(--color-plum)', fontWeight: 600, textDecoration: 'none' }}>
                            {formatIndianPhoneDisplay(l.phone)}
                          </a>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '16px 18px', fontSize: '0.825rem', color: '#64748b' }}>
                        {l.hours || '—'}
                      </td>
                      <td style={{ padding: '16px 18px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: l.is_active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: l.is_active ? '#15803d' : '#b91c1c'
                        }}>
                          {l.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => openEditLoc(l)}
                            title="Edit branch"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLoc(l.id, l.name)}
                            title="Delete branch"
                            style={{
                              padding: '6px 10px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add / Edit Branch Modal */}
          {showLocModal && (
            <div className="overlay" onClick={() => setShowLocModal(false)} style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 300,
              padding: '20px'
            }}>
              <div
                className="modal"
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '28px',
                  width: '100%',
                  maxWidth: 520,
                  boxShadow: 'var(--shadow-xl)'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.35rem', margin: 0 }}>
                    {editingLoc ? 'Edit Branch Location' : 'Add New Branch Location'}
                  </h3>
                  <button type="button" onClick={() => setShowLocModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <X size={22} />
                  </button>
                </div>

                {locErrorMessage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.85rem', marginBottom: '16px' }}>
                    <AlertCircle size={16} />
                    <span>{locErrorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSaveLocation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                      Store / Branch Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={locForm.name}
                      onChange={e => setLocForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Thirst. Anna Nagar Boutique"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={locForm.city}
                        onChange={e => setLocForm(p => ({ ...p, city: e.target.value }))}
                        placeholder="e.g. Chennai"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={locForm.phone}
                        onChange={e => setLocForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+91 87548 81546"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                      Full Address *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={locForm.address}
                      onChange={e => setLocForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="Street, Landmark, Area, Pincode"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                      Operating Hours
                    </label>
                    <input
                      type="text"
                      value={locForm.hours}
                      onChange={e => setLocForm(p => ({ ...p, hours: e.target.value }))}
                      placeholder="e.g. 2:00 PM – 12:00 AM"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                      Google Maps Link (Optional)
                    </label>
                    <input
                      type="text"
                      value={locForm.map_url}
                      onChange={e => setLocForm(p => ({ ...p, map_url: e.target.value }))}
                      placeholder="https://maps.google.com/?q=..."
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      If left blank, Google Maps direction search is automatically generated from the address.
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '4px' }}>
                        Store Type
                      </label>
                      <select
                        value={locForm.is_flagship ? 'flagship' : 'outlet'}
                        onChange={e => setLocForm(p => ({ ...p, is_flagship: e.target.value === 'flagship' }))}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="outlet">Branch Outlet</option>
                        <option value="flagship">Flagship Store</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '4px' }}>
                        Operational Status
                      </label>
                      <select
                        value={locForm.is_active ? 'active' : 'inactive'}
                        onChange={e => setLocForm(p => ({ ...p, is_active: e.target.value === 'active' }))}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="active">Active (Open)</option>
                        <option value="inactive">Inactive (Closed / Renovation)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    <button type="button" onClick={() => setShowLocModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={savingLoc} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                      {savingLoc ? 'Saving...' : <><Check size={16} /> {editingLoc ? 'Update Branch' : 'Add Branch'}</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPANY ADDRESS & HQ */}
      {activeTab === 'company' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))', gap: '28px', alignItems: 'start' }}>
          {/* Edit Form */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-plum)', marginBottom: '20px' }}>
              Company HQ & Billing Profile
            </h2>

            {companySuccessMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', color: '#166534', fontSize: '0.85rem', marginBottom: '20px' }}>
                <CheckCircle2 size={18} />
                <span>{companySuccessMsg}</span>
              </div>
            )}

            {companyErrorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#991b1b', fontSize: '0.85rem', marginBottom: '20px' }}>
                <AlertCircle size={18} />
                <span>{companyErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCompanySettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyForm.name}
                    onChange={e => setCompanyForm(p => ({ ...p, name: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={companyForm.tagline}
                    onChange={e => setCompanyForm(p => ({ ...p, tagline: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.address_line1}
                  onChange={e => setCompanyForm(p => ({ ...p, address_line1: e.target.value }))}
                  placeholder="e.g. NO.01, Siva Vishnu kovil street"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Address Line 2 (Area / Locality)
                </label>
                <input
                  type="text"
                  value={companyForm.address_line2 || ''}
                  onChange={e => setCompanyForm(p => ({ ...p, address_line2: e.target.value }))}
                  placeholder="e.g. kakkalur"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyForm.city}
                    onChange={e => setCompanyForm(p => ({ ...p, city: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyForm.state}
                    onChange={e => setCompanyForm(p => ({ ...p, state: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    value={companyForm.pincode}
                    onChange={e => setCompanyForm(p => ({ ...p, pincode: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                    Primary Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={companyForm.phone}
                    onChange={e => setCompanyForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 87548 81546"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={companyForm.email}
                    onChange={e => setCompanyForm(p => ({ ...p, email: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Opening / Operating Hours
                </label>
                <input
                  type="text"
                  value={companyForm.opening_hours}
                  onChange={e => setCompanyForm(p => ({ ...p, opening_hours: e.target.value }))}
                  placeholder="Mon–Sun: 2:00 PM – 12:00 AM"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={savingCompany}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', fontWeight: 700 }}
                >
                  {savingCompany ? (
                    <><Loader2 size={18} className="animate-spin" /> Updating Company Address...</>
                  ) : (
                    <><Save size={18} /> Save & Reflect Everywhere</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Preview Card */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <div style={{ background: 'var(--color-plum)', color: 'white', borderRadius: '24px', padding: '32px 28px', border: '2px solid var(--color-plum)', boxShadow: 'var(--shadow-md)', marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-gold)', color: 'var(--color-plum)', padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px' }}>
                <Sparkles size={13} /> Live System Flagship
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px', color: 'white' }}>
                {companyForm.name || 'Thirst.'}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '24px' }}>
                {companyForm.tagline || "India's Premium Luxury Dessert Boutique"}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <MapPin size={18} style={{ color: 'var(--color-soft-pink)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ display: 'block', color: 'white', marginBottom: '2px' }}>Flagship Address:</strong>
                    <span style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                      {getFormattedAddress(companyForm) || 'Address not yet specified'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Phone size={18} style={{ color: 'var(--color-soft-pink)', flexShrink: 0 }} />
                  <span>{formatIndianPhoneDisplay(companyForm.phone) || companyForm.phone || 'Phone not set'}</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Mail size={18} style={{ color: 'var(--color-soft-pink)', flexShrink: 0 }} />
                  <span>{companyForm.email || 'Email not set'}</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Clock size={18} style={{ color: 'var(--color-soft-pink)', flexShrink: 0 }} />
                  <span>{companyForm.opening_hours || 'Hours not set'}</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="var(--color-success)" />
                Connected Surfaces
              </div>
              <ul style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, paddingLeft: '16px', margin: 0 }}>
                <li><strong>Public Store Locations:</strong> Updates flagship card and directions.</li>
                <li><strong>Website Footer:</strong> Updates address, phone, and hours in real time.</li>
                <li><strong>Contact Page:</strong> Syncs contact details and WhatsApp chat.</li>
                <li><strong>Thermal Receipts & A4 PDFs:</strong> Prints this header on official bills.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
