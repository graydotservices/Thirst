'use client';

import { useState, useEffect } from 'react';
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
  FileText, 
  Save, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  useCompanySettings, 
  saveCompanySettings, 
  CompanySettings, 
  getFormattedAddress, 
  formatIndianPhoneDisplay 
} from '@/lib/companySettings';

type Location = { 
  id: string; 
  name: string; 
  address: string; 
  city: string; 
  phone: string; 
  hours: string; 
  isActive: boolean; 
};

const defaultDemoLocations: Location[] = [
  { 
    id: '1', 
    name: 'Thirst. Thiruvallur — Flagship', 
    address: 'NO.01, Siva Vishnu kovil street, kakkalur', 
    city: 'Thiruvallur', 
    phone: '+91 87548 81546', 
    hours: '2:00 PM – 12:00 AM', 
    isActive: true 
  },
  { 
    id: '2', 
    name: 'Thirst. Anna Nagar', 
    address: '2nd Avenue, Anna Nagar East', 
    city: 'Chennai', 
    phone: '+91 87548 81547', 
    hours: '1:00 PM – 11:30 PM', 
    isActive: true 
  },
  { 
    id: '3', 
    name: 'Thirst. Koramangala', 
    address: '7th Block, 80 Feet Road, Koramangala', 
    city: 'Bangalore', 
    phone: '+91 98765 43213', 
    hours: '12:00 PM – 11:00 PM', 
    isActive: false 
  },
];

export default function AdminLocationsPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'outlets'>('company');

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

  // Outlets State
  const [locs, setLocs] = useState<Location[]>([]);
  const [loadingLocs, setLoadingLocs] = useState(true);
  const [savingLoc, setSavingLoc] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [locErrorMessage, setLocErrorMessage] = useState('');
  const [locForm, setLocForm] = useState({ 
    name: '', 
    address: '', 
    city: 'Thiruvallur', 
    phone: '', 
    hours: '2:00 PM – 12:00 AM', 
    isActive: true 
  });

  const fetchLocations = async () => {
    setLoadingLocs(true);
    try {
      const { data, error } = await supabase
        .from('store_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setLocs(defaultDemoLocations);
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
      setLocs(defaultDemoLocations);
    } finally {
      setLoadingLocs(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySuccessMsg('');
    setCompanyErrorMsg('');
    setSavingCompany(true);

    try {
      const res = await saveCompanySettings(companyForm);
      if (res.success) {
        setCompanySuccessMsg('Company address & profile updated successfully! Changes are now live across website footer, contact page, store locations, and billing receipts.');
        await reloadSettings();
        setTimeout(() => setCompanySuccessMsg(''), 6000);
      } else {
        setCompanyErrorMsg(res.error || 'Failed to update company settings');
      }
    } catch (err: any) {
      setCompanyErrorMsg(err?.message || 'Unexpected error occurred');
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

    setSavingLoc(true);
    try {
      const payload = {
        name: locForm.name.trim(),
        address: locForm.address.trim(),
        city: locForm.city.trim(),
        phone: locForm.phone.trim(),
        hours: locForm.hours.trim(),
        is_active: locForm.isActive,
      };

      if (editingLoc) {
        const { error } = await supabase
          .from('store_locations')
          .update(payload)
          .eq('id', editingLoc.id);

        if (error) {
          console.warn('Supabase store_locations update warning:', error.message);
        }

        setLocs(prev => prev.map(l => l.id === editingLoc.id ? { ...l, ...locForm } : l));
      } else {
        const { data, error } = await supabase
          .from('store_locations')
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.warn('Supabase store_locations insert warning, saving locally:', error.message);
          setLocs(prev => [{ ...locForm, id: Date.now().toString() }, ...prev]);
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

      setShowLocModal(false);
    } catch (err: any) {
      setLocErrorMessage(err?.message || 'Failed to save location.');
    } finally {
      setSavingLoc(false);
    }
  };

  const openAddLoc = () => {
    setEditingLoc(null);
    setLocErrorMessage('');
    setLocForm({ 
      name: '', 
      address: '', 
      city: 'Thiruvallur', 
      phone: companyForm.phone || '+91 87548 81546', 
      hours: '2:00 PM – 12:00 AM', 
      isActive: true 
    });
    setShowLocModal(true);
  };

  const openEditLoc = (l: Location) => {
    setEditingLoc(l);
    setLocErrorMessage('');
    setLocForm({ 
      name: l.name, 
      address: l.address, 
      city: l.city, 
      phone: l.phone, 
      hours: l.hours, 
      isActive: l.isActive 
    });
    setShowLocModal(true);
  };

  const handleDeleteLoc = async (id: string) => {
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>
            Address & Store Management
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Update official company address, billing identity, and retail store locations
          </p>
        </div>

        {activeTab === 'outlets' && (
          <button id="btn-add-location" onClick={openAddLoc} className="btn btn-primary">
            <Plus size={18} /> Add Branch Outlet
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--color-border)', marginBottom: 'var(--space-6)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <button
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
            color: activeTab === 'company' ? 'var(--color-berry)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          <Building2 size={18} />
          Official Company Address & HQ Profile
        </button>
        <button
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
            color: activeTab === 'outlets' ? 'var(--color-berry)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          <MapPin size={18} />
          Store Branches & Outlets ({locs.length})
        </button>
      </div>

      {/* TAB 1: COMPANY ADDRESS & HQ PROFILE */}
      {activeTab === 'company' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: 'var(--space-6)', alignItems: 'start' }}>
          {/* Edit Form */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
              <Building2 size={20} style={{ color: 'var(--color-berry)' }} />
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-plum)' }}>
                Company Address Details
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 'var(--space-5)' }}>
              This address and contact details automatically reflect on the public website (Footer, Contact, About, Store Locations) and appear on all generated invoices and thermal receipts.
            </p>

            {companySuccessMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-md)', color: '#047857', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
                <Check size={18} style={{ flexShrink: 0 }} />
                <span>{companySuccessMsg}</span>
              </div>
            )}

            {companyErrorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{companyErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCompanySettings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="comp-name">Brand / Entity Name *</label>
                  <input
                    id="comp-name"
                    required
                    className="input"
                    value={companyForm.name || ''}
                    onChange={e => setCompanyForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Thirst."
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="comp-tagline">Brand Tagline</label>
                  <input
                    id="comp-tagline"
                    className="input"
                    value={companyForm.tagline || ''}
                    onChange={e => setCompanyForm(p => ({ ...p, tagline: e.target.value }))}
                    placeholder="India's Premium Luxury Dessert Boutique"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="comp-addr1">Address Line 1 (Street / Building) *</label>
                <input
                  id="comp-addr1"
                  required
                  className="input"
                  value={companyForm.address_line1 || ''}
                  onChange={e => setCompanyForm(p => ({ ...p, address_line1: e.target.value }))}
                  placeholder="NO.01, Siva Vishnu kovil street"
                />
              </div>

              <div className="grid grid-3" style={{ gap: 'var(--space-3)' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="comp-addr2">Area / Locality</label>
                  <input
                    id="comp-addr2"
                    className="input"
                    value={companyForm.address_line2 || ''}
                    onChange={e => setCompanyForm(p => ({ ...p, address_line2: e.target.value }))}
                    placeholder="kakkalur"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="comp-city">City *</label>
                  <input
                    id="comp-city"
                    required
                    className="input"
                    value={companyForm.city || ''}
                    onChange={e => setCompanyForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="Thiruvallur"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="comp-state">State *</label>
                  <input
                    id="comp-state"
                    required
                    className="input"
                    value={companyForm.state || ''}
                    onChange={e => setCompanyForm(p => ({ ...p, state: e.target.value }))}
                    placeholder="Tamil Nadu"
                  />
                </div>
              </div>

              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="comp-pincode">PIN Code *</label>
                  <input
                    id="comp-pincode"
                    required
                    maxLength={6}
                    className="input"
                    value={companyForm.pincode || ''}
                    onChange={e => setCompanyForm(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))}
                    placeholder="602001"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="comp-hours">Operating Hours</label>
                  <input
                    id="comp-hours"
                    className="input"
                    value={companyForm.opening_hours || ''}
                    onChange={e => setCompanyForm(p => ({ ...p, opening_hours: e.target.value }))}
                    placeholder="Mon–Sun: 2:00 PM – 12:00 AM"
                  />
                </div>
              </div>

              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="comp-phone">Primary Phone / WhatsApp *</label>
                  <input
                    id="comp-phone"
                    required
                    type="tel"
                    className="input"
                    value={companyForm.phone || ''}
                    onChange={e => setCompanyForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 87548 81546"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="comp-email">Official Email *</label>
                  <input
                    id="comp-email"
                    required
                    type="email"
                    className="input"
                    value={companyForm.email || ''}
                    onChange={e => setCompanyForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="thirst.freshchennai@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="comp-gstin">GSTIN Number</label>
                  <input
                    id="comp-gstin"
                    className="input"
                    value={companyForm.gstin || ''}
                    onChange={e => setCompanyForm(p => ({ ...p, gstin: e.target.value.toUpperCase() }))}
                    placeholder="33AABCT0000A1Z5"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="comp-fssai">FSSAI License Number</label>
                  <input
                    id="comp-fssai"
                    className="input"
                    value={companyForm.fssai || ''}
                    onChange={e => setCompanyForm(p => ({ ...p, fssai: e.target.value }))}
                    placeholder="22425478001152"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="comp-maps">Google Maps URL</label>
                <input
                  id="comp-maps"
                  className="input"
                  value={companyForm.google_maps_url || ''}
                  onChange={e => setCompanyForm(p => ({ ...p, google_maps_url: e.target.value }))}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div style={{ marginTop: 'var(--space-3)' }}>
                <button
                  type="submit"
                  disabled={savingCompany}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
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

          {/* Live Preview Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ background: 'var(--color-plum)', color: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', border: '2px solid var(--color-plum)', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-gold)', color: 'var(--color-plum)', padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px' }}>
                <Sparkles size={13} /> Live System Preview
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px', color: 'white' }}>
                {companyForm.name || 'Thirst.'}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '20px' }}>
                {companyForm.tagline || "India's Premium Luxury Dessert Boutique"}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
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

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.15)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                  <span>FSSAI: {companyForm.fssai || '—'}</span>
                  <span>GSTIN: {companyForm.gstin || '—'}</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="var(--color-success)" />
                Connected Components
              </div>
              <ul style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, paddingLeft: '16px', margin: 0 }}>
                <li><strong>Public Website Footer:</strong> Updates address, phone, email, and GSTIN automatically.</li>
                <li><strong>Contact Page:</strong> Updates interactive cards and direct WhatsApp contact.</li>
                <li><strong>Store Locations:</strong> Updates flagship branch name and map coordinates.</li>
                <li><strong>Billing & POS (Thermal Receipts):</strong> Prints this updated header on 80mm/58mm thermal bills.</li>
                <li><strong>A4 PDF Invoices:</strong> Uses this header and tax registration on downloadable PDF bills.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STORE BRANCHES & OUTLETS */}
      {activeTab === 'outlets' && (
        <>
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
                {loadingLocs ? (
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
                        {l.phone ? <a href={`tel:${l.phone.replace(/\s+/g, '')}`} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>{l.phone}</a> : '—'}
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>{l.hours || '—'}</td>
                      <td>
                        <span className={`badge ${l.isActive ? 'badge-success' : 'badge-error'}`}>
                          {l.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button onClick={() => openEditLoc(l)} title="Edit location" className="btn btn-secondary btn-sm">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDeleteLoc(l.id)} title="Delete location" style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}>
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

          {/* Outlet Modal */}
          {showLocModal && (
            <div className="overlay" onClick={() => setShowLocModal(false)}>
              <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.25rem' }}>
                    {editingLoc ? 'Edit Branch Location' : 'Add Branch Location'}
                  </h3>
                  <button onClick={() => setShowLocModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={22} /></button>
                </div>

                {locErrorMessage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>
                    <AlertCircle size={16} />
                    <span>{locErrorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSaveLocation} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="loc-name">Store Name *</label>
                    <input id="loc-name" required className="input" value={locForm.name} onChange={e => setLocForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Thirst. Anna Nagar" />
                  </div>
                  <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                    <div className="input-group">
                      <label className="input-label" htmlFor="loc-city">City *</label>
                      <input id="loc-city" required className="input" value={locForm.city} onChange={e => setLocForm(p => ({ ...p, city: e.target.value }))} placeholder="Chennai" />
                    </div>
                    <div className="input-group">
                      <label className="input-label" htmlFor="loc-phone">Phone</label>
                      <input id="loc-phone" type="tel" inputMode="tel" className="input" value={locForm.phone} onChange={e => setLocForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 87548 81546" />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="loc-addr">Full Address *</label>
                    <input id="loc-addr" required className="input" value={locForm.address} onChange={e => setLocForm(p => ({ ...p, address: e.target.value }))} placeholder="Street, Area, Landmark" />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="loc-hours">Business Hours</label>
                    <input id="loc-hours" className="input" value={locForm.hours} onChange={e => setLocForm(p => ({ ...p, hours: e.target.value }))} placeholder="e.g. 2:00 PM – 12:00 AM" />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="loc-status">Operational Status</label>
                    <select id="loc-status" className="input" value={locForm.isActive ? 'active' : 'inactive'} onChange={e => setLocForm(p => ({ ...p, isActive: e.target.value === 'active' }))}>
                      <option value="active">Active (Open)</option>
                      <option value="inactive">Inactive (Closed / Renovation)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                    <button type="button" onClick={() => setShowLocModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                    <button type="submit" disabled={savingLoc} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                      {savingLoc ? 'Saving...' : <><Check size={16} /> {editingLoc ? 'Update Location' : 'Add Location'}</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
