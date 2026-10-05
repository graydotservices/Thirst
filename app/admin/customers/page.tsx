'use client';

import { useState, useEffect } from 'react';
import { Search, UserPlus, Star, Phone, Mail, Calendar, ShoppingBag, X, Gift, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

type OrderSnippet = {
  id: string;
  bill_no: string;
  total: number;
  created_at: string;
  payment_method: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OrderSnippet[]>([]);
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

  const fetchCustomers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('last_visit', { ascending: false, nullsFirst: false });
    
    if (data) setCustomers(data as Customer[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch recent orders when customer modal opens
  useEffect(() => {
    if (!selected) {
      setCustomerOrders([]);
      return;
    }

    const fetchOrders = async () => {
      setLoadingOrders(true);
      const { data } = await supabase
        .from('orders')
        .select('id, bill_no, total, created_at, payment_method')
        .eq('customer_phone', selected.phone)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) setCustomerOrders(data as OrderSnippet[]);
      setLoadingOrders(false);
    };

    fetchOrders();
  }, [selected]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    const cleanPhone = formData.phone.trim();
    const cleanName = formData.name.trim();

    if (!cleanName) {
      setAddError('Please enter customer name');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setAddError('Please enter a valid 10-digit phone number');
      return;
    }

    setSavingCustomer(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: cleanName,
          phone: cleanPhone,
          email: formData.email.trim() || null,
          birthday: formData.birthday || null,
          loyalty_points: 0,
          total_purchase: 0,
          last_visit: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          setAddError('A customer with this phone number already exists.');
        } else {
          setAddError(error.message || 'Failed to add customer.');
        }
        return;
      }

      if (data) {
        setCustomers(prev => [data as Customer, ...prev]);
        setShowAddModal(false);
        setFormData({ name: '', phone: '', email: '', birthday: '' });
      }
    } catch (err: any) {
      setAddError(err?.message || 'Unexpected error occurred.');
    } finally {
      setSavingCustomer(false);
    }
  };

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Customer CRM</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{customers.length} registered customers</p>
        </div>
        <button 
          id="btn-add-customer" 
          onClick={() => { setAddError(''); setShowAddModal(true); }} 
          className="btn btn-primary"
        >
          <UserPlus size={18} /> Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)', gap: 'var(--space-4)' }}>
        {[
          { label: 'Total Customers', value: customers.length, icon: UserPlus, color: 'var(--color-berry)' },
          { label: 'Total Loyalty Points', value: customers.reduce((s, c) => s + (c.loyalty_points || 0), 0).toLocaleString('en-IN'), icon: Star, color: 'var(--color-gold-dark)' },
          { 
            label: 'Total Revenue', 
            value: (() => {
              const total = customers.reduce((s, c) => s + Number(c.total_purchase || 0), 0);
              return total >= 100000 ? `₹${(total / 100000).toFixed(1)}L` : `₹${total.toLocaleString('en-IN')}`;
            })(), 
            icon: ShoppingBag, color: '#6366f1' 
          },
          { label: 'Avg. Revenue/Cust', value: customers.length > 0 ? `₹${Math.round(customers.reduce((s, c) => s + Number(c.total_purchase || 0), 0) / customers.length).toLocaleString('en-IN')}` : '₹0', icon: Calendar, color: 'var(--color-success)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.375rem', color: 'var(--color-plum)' }}>{value}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-5)', maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input 
          id="customer-search" 
          className="input" 
          placeholder="Search by name or phone..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ paddingLeft: 44, background: 'white' }} 
        />
      </div>

      {/* Table */}
      <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ minWidth: '650px' }}>
          <thead>
            <tr><th>Customer</th><th>Phone</th><th>Last Visit</th><th>Loyalty Pts</th><th>Total Spent</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 size={18} className="animate-spin" /> Loading customers...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                  No customers found matching &quot;{search}&quot;.
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                        {c.name ? c.name[0].toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{c.name || 'Unnamed Customer'}</div>
                        {c.email && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                        {c.phone}
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{c.last_visit ? new Date(c.last_visit).toLocaleDateString('en-IN') : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={13} fill="var(--color-gold)" color="var(--color-gold)" />
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)' }}>
                        {(c.loyalty_points || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-berry)' }}>
                    ₹{Number(c.total_purchase || 0).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <button onClick={() => setSelected(c)} className="btn btn-secondary btn-sm">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
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
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Full Name *
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
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Phone Number (10 digits) *
                </label>
                <input 
                  type="tel" 
                  inputMode="tel"
                  maxLength={10}
                  required 
                  className="input" 
                  placeholder="e.g. 9876543210" 
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Email Address (Optional)
                </label>
                <input 
                  type="email" 
                  className="input" 
                  placeholder="e.g. priya@gmail.com" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Birthday (Optional)
                </label>
                <input 
                  type="date" 
                  className="input" 
                  value={formData.birthday} 
                  onChange={e => setFormData({ ...formData, birthday: e.target.value })} 
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
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

      {/* Customer Detail Modal */}
      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--gradient-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.5rem', flexShrink: 0 }}>
                  {selected.name ? selected.name[0].toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.375rem' }}>{selected.name || 'Customer'}</h3>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} />{selected.phone || '—'}</span>
                    {selected.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} />{selected.email}</span>}
                    {selected.birthday && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} />Born: {selected.birthday}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={22} /></button>
            </div>

            {/* Stats */}
            <div className="grid grid-3" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              {[
                { label: 'Total Spent', value: `₹${Number(selected.total_purchase || 0).toLocaleString('en-IN')}`, icon: ShoppingBag },
                { label: 'Loyalty Points', value: (selected.loyalty_points || 0).toLocaleString('en-IN'), icon: Star },
                { label: 'Last Visit', value: selected.last_visit ? new Date(selected.last_visit).toLocaleDateString('en-IN') : '—', icon: Gift },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--color-lavender)', borderRadius: 'var(--radius-lg)' }}>
                  <Icon size={20} style={{ color: 'var(--color-berry)', margin: '0 auto var(--space-2)' }} />
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.125rem' }}>{value}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Recent Orders List */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', marginBottom: 'var(--space-3)' }}>
                Recent Order History
              </h4>
              {loadingOrders ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading recent orders...</p>
              ) : customerOrders.length === 0 ? (
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-lavender)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No recent orders found for this customer.
                </div>
              ) : (
                <div className="table-container" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Bill No.</th>
                        <th>Date</th>
                        <th>Payment</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerOrders.map(order => (
                        <tr key={order.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-berry)' }}>{order.bill_no}</td>
                          <td style={{ fontSize: '0.8125rem' }}>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          <td style={{ textTransform: 'capitalize', fontSize: '0.8125rem' }}>{order.payment_method || 'Cash'}</td>
                          <td style={{ fontWeight: 700, color: 'var(--color-plum)' }}>₹{order.total.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
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

