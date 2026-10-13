'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  Star, 
  Phone, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  X, 
  Gift, 
  AlertCircle, 
  Loader2, 
  Edit2, 
  MessageCircle, 
  Printer, 
  Download, 
  Check,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTablePage } from '@/lib/useTablePage';
import Pagination from '@/components/admin/Pagination';
import { 
  useCompanySettings, 
  formatIndianPhoneDisplay, 
  getWhatsAppPhone, 
  createWhatsAppUrl 
} from '@/lib/companySettings';
import { 
  printThermalReceipt, 
  generateInvoicePDF, 
  sendBillViaWhatsApp, 
  OrderData 
} from '@/lib/pdfUtils';

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  birthday: string | null;
  loyalty_points: number;
  total_purchase: number;
  last_visit: string | null;
};

type OrderRecord = {
  id: string;
  bill_no: string;
  total: number;
  subtotal: number;
  discount: number;
  created_at: string;
  payment_method: string;
  customer_name: string;
  customer_phone: string;
  items: Array<{ name: string; qty: number; price: number; total: number; product_id?: string }>;
  billed_by?: string;
};

export default function CustomersPage() {
  const { settings } = useCompanySettings();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Add customer modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [addError, setAddError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birthday: '',
  });

  // Edit customer modal state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birthday: '',
  });

  const { rows: customers, setRows: setCustomers, total, loading, error: listError, page, pageSize, setPage, reload } = useTablePage<Customer>({
    table: 'customers', columns: 'id,name,phone,email,birthday,loyalty_points,total_purchase,last_visit',
    search, searchColumns: ['name','phone','email'], sort: 'last_visit',
  });
  const [summary, setSummary] = useState<{count:number;loyaltyPoints:number;revenue:number} | null>(null);
  const [summaryVersion, setSummaryVersion] = useState(0);
  const [summaryError, setSummaryError] = useState('');
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      const { data, error } = await supabase.rpc('customer_summary');
      if (!active) return;
      if (error || !data) { setSummaryError('Unable to load customer totals. Check the connection and database migrations.'); return; }
      setSummary(data); setSummaryError('');
    });
    return () => { active = false; };
  }, [summaryVersion]);

  // Fetch recent orders when customer modal opens
  useEffect(() => {
    if (!selected) {
      void Promise.resolve().then(() => setCustomerOrders([]));
      return;
    }

    const customer = selected;
    async function fetchOrders() {
      setLoadingOrders(true);
      try {
        const cleanPhone = customer.phone.replace(/\D/g, '').slice(-10);
        const { data } = await supabase
          .from('orders')
          .select('*')
          .or(`customer_id.eq.${customer.id},customer_phone.eq.${cleanPhone}`)
          .order('created_at', { ascending: false })
          .limit(10);

        setCustomerOrders((data || []) as OrderRecord[]);
      } catch (e) {
        setCustomerOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    }

    void Promise.resolve().then(fetchOrders);
  }, [selected]);

  // Clean phone helper
  const extractCleanPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  // ADD CUSTOMER HANDLER
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    const cleanPhone = extractCleanPhone(formData.phone);
    const cleanName = formData.name.trim();

    if (!cleanName) {
      setAddError('Please enter customer full name');
      return;
    }
    if (!cleanPhone || cleanPhone.length !== 10) {
      setAddError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setSavingCustomer(true);
    try {
      const newCustPayload = {
        name: cleanName,
        phone: cleanPhone,
        email: formData.email.trim() || null,
        birthday: formData.birthday || null,
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([newCustPayload])
        .select()
        .single();

      if (error) {
        setAddError(error.code === '23505' ? 'A customer with this phone already exists.' : 'Unable to save the customer. Please try again.');
        return;
      }

      if (data) {
        setCustomers(prev => [data as Customer, ...prev]);
        reload(); setSummaryVersion(value => value + 1);
        setShowAddModal(false);
        setFormData({ name: '', phone: '', email: '', birthday: '' });
      }
    } catch (err: unknown) {
      setAddError((err instanceof Error ? err.message : '') || 'Unexpected error occurred.');
    } finally {
      setSavingCustomer(false);
    }
  };

  // OPEN EDIT CUSTOMER
  const openEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setEditError('');
    setEditFormData({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      birthday: c.birthday || '',
    });
  };

  // SAVE EDIT CUSTOMER
  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setEditError('');

    const cleanPhone = extractCleanPhone(editFormData.phone);
    const cleanName = editFormData.name.trim();

    if (!cleanName) {
      setEditError('Please enter customer full name');
      return;
    }
    if (!cleanPhone || cleanPhone.length !== 10) {
      setEditError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setSavingEdit(true);
    try {
      const updates = {
        name: cleanName,
        phone: cleanPhone,
        email: editFormData.email.trim() || null,
        birthday: editFormData.birthday || null,
      };

      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', editingCustomer.id);

      if (error) { setEditError('Unable to save the customer. Check for a duplicate phone number.'); return; }

      // Update in local state
      const updatedCust: Customer = {
        ...editingCustomer,
        ...updates,
      };

      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updatedCust : c));
      if (selected?.id === editingCustomer.id) {
        setSelected(updatedCust);
      }

      setEditingCustomer(null);
      reload(); setSummaryVersion(value => value + 1);
    } catch (err: unknown) {
      setEditError((err instanceof Error ? err.message : '') || 'Failed to update customer');
    } finally {
      setSavingEdit(false);
    }
  };

  const filtered = customers;

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', color: 'var(--color-plum)' }}>
            Customer CRM
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            {summary?.count ?? total} registered customers · Loyalty tracking & purchase history
          </p>
        </div>
        <button 
          id="btn-add-customer" 
          onClick={() => { setAddError(''); setFormData({ name: '', phone: '', email: '', birthday: '' }); setShowAddModal(true); }} 
          className="btn btn-primary"
          style={{ padding: '10px 18px' }}
        >
          <UserPlus size={18} /> Add Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-5)', gap: 'var(--space-3)' }}>
        {[
          { label: 'Total Customers', value: summary?.count ?? '—', icon: UserPlus, color: 'var(--color-berry)' },
          { label: 'Loyalty Points', value: summary?.loyaltyPoints.toLocaleString('en-IN') ?? '—', icon: Star, color: 'var(--color-gold-dark)' },
          { 
            label: 'Total Revenue', 
            value: (() => {
              if (!summary) return '—';
              const total = summary.revenue;
              return total >= 100000 ? `₹${(total / 100000).toFixed(1)}L` : `₹${total.toLocaleString('en-IN')}`;
            })(), 
            icon: ShoppingBag, color: '#6366f1' 
          },
          { label: 'Avg Spend / Cust', value: summary ? (summary.count > 0 ? `₹${Math.round(summary.revenue / summary.count).toLocaleString('en-IN')}` : '₹0') : '—', icon: Calendar, color: 'var(--color-success)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card" style={{ padding: 'clamp(12px, 3vw, 18px)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                <Icon size={18} />
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.15rem, 4vw, 1.375rem)', color: 'var(--color-plum)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-4)', maxWidth: 440, width: '100%' }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input 
          id="customer-search" 
          className="input" 
          placeholder="Search by name, phone or email..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ paddingLeft: 44, background: 'white' }} 
        />
      </div>

      {(listError || summaryError) && <p role="alert">{listError || summaryError} <button className="btn btn-secondary btn-sm" onClick={() => { reload(); setSummaryVersion(value => value + 1); }}>Retry</button></p>}
      {/* Customers Table */}
      <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ minWidth: '750px' }}>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone Number</th>
              <th>Direct WhatsApp</th>
              <th>Loyalty Pts</th>
              <th>Total Spent</th>
              <th>Last Visit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 size={18} className="animate-spin" /> Loading customers...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                  No customers found matching &quot;{search}&quot;.
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gradient-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                        {c.name ? c.name[0].toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-plum)' }}>{c.name || 'Valued Customer'}</div>
                        {c.email && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      {formatIndianPhoneDisplay(c.phone) || c.phone}
                    </span>
                  </td>
                  <td>
                    {/* DIRECT WHATSAPP BUTTON WITH INDIAN (+91) FORMAT */}
                    <a
                      href={createWhatsAppUrl(c.phone, `Hello ${c.name || ''}, greetings from Thirst.! How can we sweeten your day?`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm"
                      style={{
                        background: '#25D366',
                        color: 'white',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                      title="Open WhatsApp Chat"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={14} fill="var(--color-gold)" color="var(--color-gold)" />
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)' }}>
                        {(c.loyalty_points || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-berry)', fontSize: '0.95rem' }}>
                      ₹{Number(c.total_purchase || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {c.last_visit ? new Date(c.last_visit).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setSelected(c)} className="btn btn-secondary btn-sm" title="View details and order history">
                        View
                      </button>
                      <button onClick={() => openEditCustomer(c)} className="btn btn-ghost btn-sm" title="Edit customer details" style={{ padding: '6px 8px' }}>
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} loading={loading} onChange={setPage} />

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(217,79,138,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-berry)' }}>
                  <UserPlus size={20} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.25rem' }}>
                  Add New Customer
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {addError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>
                <AlertCircle size={16} />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Customer Name *
                </label>
                <input 
                  type="text" 
                  required 
                  className="input" 
                  placeholder="e.g. Priya Sharma" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  WhatsApp / Phone Number (10 digits) *
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--color-lavender)', borderRadius: 'var(--radius-md)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.85rem' }}>
                    +91
                  </span>
                  <input 
                    type="tel" 
                    inputMode="tel"
                    maxLength={10}
                    required 
                    className="input" 
                    placeholder="9876543210" 
                    value={formData.phone} 
                    onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} 
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Email Address (Optional)
                </label>
                <input 
                  type="email" 
                  className="input" 
                  placeholder="priya@gmail.com" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Birthday (For Anniversary & Birthday Offers)
                </label>
                <input 
                  type="date" 
                  className="input" 
                  value={formData.birthday} 
                  onChange={e => setFormData({ ...formData, birthday: e.target.value })} 
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={savingCustomer}
                >
                  {savingCustomer ? 'Saving...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {editingCustomer && (
        <div className="overlay" onClick={() => setEditingCustomer(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(217,79,138,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-berry)' }}>
                  <Edit2 size={20} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.25rem' }}>
                  Edit Customer Profile
                </h3>
              </div>
              <button onClick={() => setEditingCustomer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>
                <AlertCircle size={16} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input 
                  type="text" 
                  required 
                  className="input" 
                  value={editFormData.name} 
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Phone Number (10 digits) *
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--color-lavender)', borderRadius: 'var(--radius-md)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.85rem' }}>
                    +91
                  </span>
                  <input 
                    type="tel" 
                    inputMode="tel"
                    maxLength={10}
                    required 
                    className="input" 
                    value={editFormData.phone} 
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} 
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input 
                  type="email" 
                  className="input" 
                  value={editFormData.email} 
                  onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Birthday
                </label>
                <input 
                  type="date" 
                  className="input" 
                  value={editFormData.birthday} 
                  onChange={e => setEditFormData({ ...editFormData, birthday: e.target.value })} 
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setEditingCustomer(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAIL & PURCHASE HISTORY MODAL */}
      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--gradient-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', flexShrink: 0 }}>
                  {selected.name ? selected.name[0].toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.375rem' }}>
                    {selected.name || 'Valued Customer'}
                  </h3>
                  <div style={{ display: 'flex', gap: '14px', color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace' }}>
                      <Phone size={14} /> {formatIndianPhoneDisplay(selected.phone)}
                    </span>
                    {selected.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} />{selected.email}</span>}
                    {selected.birthday && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} />Born: {selected.birthday}</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={() => openEditCustomer(selected)} 
                  className="btn btn-secondary btn-sm"
                  title="Edit Customer"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Quick Action: Direct WhatsApp Chat */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: 'var(--space-5)' }}>
              <a
                href={createWhatsAppUrl(selected.phone, `Hello ${selected.name || ''}, this is Thirst. Cafe. Thank you for being our valued customer!`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{
                  background: '#25D366',
                  color: 'white',
                  flex: 1,
                  justifyContent: 'center',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  textDecoration: 'none'
                }}
              >
                <MessageCircle size={18} style={{ marginRight: '6px' }} /> Chat on WhatsApp (+91 {selected.phone})
              </a>
            </div>

            {/* Stats Metrics */}
            <div className="grid grid-3" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              {[
                { label: 'Total Purchase Amount', value: `₹${Number(selected.total_purchase || 0).toLocaleString('en-IN')}`, icon: ShoppingBag, color: 'var(--color-berry)' },
                { label: 'Loyalty Points Earned', value: `${(selected.loyalty_points || 0).toLocaleString('en-IN')} pts`, icon: Star, color: 'var(--color-gold-dark)' },
                { label: 'Last Visit Date', value: selected.last_visit ? new Date(selected.last_visit).toLocaleDateString('en-IN') : '—', icon: Gift, color: '#6366f1' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--color-lavender)', borderRadius: 'var(--radius-lg)' }}>
                  <Icon size={20} style={{ color, margin: '0 auto var(--space-2)' }} />
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.15rem' }}>{value}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* CONNECTED PURCHASE HISTORY */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.1rem' }}>
                  Connected Purchase History ({customerOrders.length})
                </h4>
              </div>

              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
                  <Loader2 size={20} className="animate-spin" style={{ display: 'inline', marginRight: '8px' }} /> Loading orders...
                </div>
              ) : customerOrders.length === 0 ? (
                <div style={{ padding: 'var(--space-5)', background: 'var(--color-lavender)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No past orders found recorded for this customer phone number.
                </div>
              ) : (
                <div className="table-container" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                  <table style={{ minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th>Bill No.</th>
                        <th>Date & Time</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Print / Share Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerOrders.map(order => {
                        const orderDataObj: OrderData = {
                          bill_no: order.bill_no,
                          created_at: order.created_at,
                          customer_name: order.customer_name || selected.name,
                          customer_phone: order.customer_phone || selected.phone,
                          items: order.items || [],
                          subtotal: order.subtotal || order.total,
                          discount: order.discount || 0,
                          gst: 0,
                          total: order.total,
                          payment_method: order.payment_method || 'cash',
                          billed_by: order.billed_by
                        };

                        return (
                          <tr key={order.id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-berry)' }}>
                              {order.bill_no}
                            </td>
                            <td style={{ fontSize: '0.8125rem' }}>
                              {new Date(order.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ fontWeight: 800, color: 'var(--color-plum)' }}>
                              ₹{order.total.toLocaleString('en-IN')}
                            </td>
                            <td style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>
                              <span className="badge badge-primary">{order.payment_method || 'cash'}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => printThermalReceipt(orderDataObj, '80mm', settings)}
                                  className="btn btn-secondary btn-sm"
                                  title="Print 80mm Thermal Receipt"
                                  style={{ padding: '6px 8px' }}
                                >
                                  <Printer size={13} /> Thermal
                                </button>
                                <button
                                  onClick={() => generateInvoicePDF(orderDataObj, true, settings)}
                                  className="btn btn-secondary btn-sm"
                                  title="Download A4 PDF"
                                  style={{ padding: '6px 8px' }}
                                >
                                  <Download size={13} /> A4
                                </button>
                                <button
                                  onClick={() => sendBillViaWhatsApp(orderDataObj, settings)}
                                  className="btn btn-sm"
                                  style={{ background: '#25D366', color: 'white', padding: '6px 8px', border: 'none', borderRadius: 'var(--radius-md)' }}
                                  title="Send Bill via WhatsApp"
                                >
                                  <MessageCircle size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
