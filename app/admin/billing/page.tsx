'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  MessageCircle, 
  Download, 
  Check, 
  User, 
  Star, 
  X, 
  FileText, 
  ChevronDown, 
  PhoneCall,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { 
  generateInvoicePDF, 
  printThermalReceipt, 
  sendBillViaWhatsApp, 
  formatWhatsAppBillMessage,
  OrderData 
} from '@/lib/pdfUtils';
import { 
  useCompanySettings, 
  formatIndianPhoneDisplay, 
  getWhatsAppPhone, 
  createWhatsAppUrl 
} from '@/lib/companySettings';
import { supabase } from '@/lib/supabase';

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  category: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  stock: number;
};

type CustomerItem = {
  id: string;
  name: string;
  phone: string;
  loyalty_points?: number;
  total_purchase?: number;
};

export default function BillingPage() {
  const { settings } = useCompanySettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  
  // Customer selection & CRM state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerLoyaltyPoints, setCustomerLoyaltyPoints] = useState<number | null>(null);
  const [existingCustomers, setExistingCustomers] = useState<CustomerItem[]>([]);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Billing state
  const [billGenerated, setBillGenerated] = useState(false);
  const [billNo, setBillNo] = useState('');
  const [completedOrderData, setCompletedOrderData] = useState<OrderData | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [billedBy, setBilledBy] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'menu' | 'cart'>('menu');
  const [thermalWidth, setThermalWidth] = useState<'80mm' | '58mm'>('80mm');

  // Fetch products, active staff, and existing customers for autocomplete
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true);
      
      if (data) {
        setProducts(data as Product[]);
      }
    };
    
    const fetchStaff = async () => {
      const { data } = await supabase
        .from('staff')
        .select('*')
        .eq('status', 'active');

      if (data && data.length > 0) {
        setStaffList(data);
        setBilledBy(data[0].id);
      }
    };

    const fetchCustomers = async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, name, phone, loyalty_points, total_purchase')
        .order('last_visit', { ascending: false, nullsFirst: false })
        .limit(100);

      if (data) {
        setExistingCustomers(data as CustomerItem[]);
      }
    };
    
    fetchProducts();
    fetchStaff();
    fetchCustomers();
  }, []);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Filter existing customers by phone or name
  const filteredCustomers = existingCustomers.filter(c => {
    const qPhone = customerPhone.replace(/\D/g, '');
    const qName = customerName.toLowerCase().trim();
    if (!qPhone && !qName) return true;
    const matchPhone = qPhone ? c.phone.includes(qPhone) : false;
    const matchName = qName ? (c.name || '').toLowerCase().includes(qName) : false;
    return matchPhone || matchName;
  });

  const selectExistingCustomer = (c: CustomerItem) => {
    setCustomerName(c.name || '');
    setCustomerPhone(c.phone || '');
    setSelectedCustomerId(c.id);
    setCustomerLoyaltyPoints(c.loyalty_points || 0);
    setCustomerDropdownOpen(false);
  };

  const handlePhoneChange = (val: string) => {
    setCustomerPhone(val);
    const cleanDigits = val.replace(/\D/g, '');
    if (cleanDigits.length >= 10) {
      const found = existingCustomers.find(c => c.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10)));
      if (found) {
        setCustomerName(found.name || '');
        setSelectedCustomerId(found.id);
        setCustomerLoyaltyPoints(found.loyalty_points || 0);
      }
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('This product is out of stock!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert(`Only ${product.stock} items available in stock.`);
          return prev;
        }
        return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(c => c.id !== id));
      return;
    }
    const product = products.find(p => p.id === id);
    if (product && qty > product.stock) {
      alert(`Only ${product.stock} items available in stock.`);
      return;
    }
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c));
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmt = Math.round(subtotal * (discount / 100));
  const total = Math.max(0, subtotal - discountAmt);

  // Validate Indian Phone number (10 digits)
  const rawDigits = customerPhone.replace(/\D/g, '');
  const isIndianPhoneValid = rawDigits.length === 10 || (rawDigits.length === 12 && rawDigits.startsWith('91'));

  // IMMEDIATE BILL GENERATION (Payment completion & verification step removed completely!)
  const handleGenerateBill = async () => {
    if (cart.length === 0 || saving) return;
    setSaving(true);

    try {
      const now = new Date();
      const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const todayStr = istTime.toISOString().slice(0, 10);
      const dateCode = todayStr.replace(/-/g, '');

      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${todayStr}T00:00:00.000Z`)
        .lte('created_at', `${todayStr}T23:59:59.999Z`);
        
      const seq = ((count || 0) + 1).toString().padStart(3, '0');
      const no = `TH-${dateCode}-${seq}`;

      // Upsert / Link customer
      let customerId: string | null = selectedCustomerId;
      let currentPoints = customerLoyaltyPoints || 0;
      let currentTotalPurchase = 0;

      const cleanPhoneDigits = customerPhone.replace(/\D/g, '').slice(-10);

      if (cleanPhoneDigits && cleanPhoneDigits.length === 10) {
        const { data: customer } = await supabase
          .from('customers')
          .upsert(
            {
              phone: cleanPhoneDigits,
              name: customerName.trim() || 'Valued Customer',
              last_visit: new Date().toISOString(),
            },
            { onConflict: 'phone', ignoreDuplicates: false }
          )
          .select()
          .single();
          
        if (customer) {
          customerId = customer.id;
          currentPoints = customer.loyalty_points || 0;
          currentTotalPurchase = Number(customer.total_purchase) || 0;
        }
      }

      const selectedStaff = staffList.find(s => s.id === billedBy);
      const billedByName = selectedStaff ? `${selectedStaff.name} (${selectedStaff.role})` : 'Admin';

      const finalItems = cart.map(c => ({
        product_id: String(c.id),
        name: c.name,
        price: c.price,
        qty: c.qty,
        total: c.price * c.qty
      }));

      // Try RPC first for atomic transaction, fallback to direct insert
      const { data: rpcData, error: rpcError } = await supabase.rpc('place_order_atomic', {
        p_customer_name: customerName || 'Walk-in',
        p_customer_phone: cleanPhoneDigits || '0000000000',
        p_customer_id: customerId,
        p_items: finalItems,
        p_subtotal: subtotal,
        p_discount: discountAmt,
        p_gst: 0,
        p_total: total,
        p_payment_method: paymentMethod,
        p_payment_ref: null,
        p_bill_no: no,
        p_staff_id: selectedStaff?.id || null,
        p_billed_by: billedByName,
      });

      if (rpcError) {
        // Fallback to standard insert
        await supabase
          .from('orders')
          .insert([{
            customer_name: customerName || 'Walk-in',
            customer_phone: cleanPhoneDigits || '0000000000',
            customer_id: customerId,
            items: finalItems,
            subtotal,
            discount: discountAmt,
            gst: 0,
            total,
            payment_method: paymentMethod,
            payment_ref: null,
            bill_no: no,
            staff_id: selectedStaff?.id || null,
            billed_by: billedByName,
            status: 'completed',
          }]);

        // Decrement stock
        for (const item of cart) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.id)
            .single();
            
          if (product) {
            await supabase
              .from('products')
              .update({ stock: Math.max(0, product.stock - item.qty) })
              .eq('id', item.id);
          }
        }

        // Update customer points
        if (customerId) {
          const pointsEarned = Math.floor(total / 100);
          await supabase
            .from('customers')
            .update({
              loyalty_points: currentPoints + pointsEarned,
              total_purchase: currentTotalPurchase + total,
            })
            .eq('id', customerId);
        }
      }

      const orderData: OrderData = {
        bill_no: no,
        created_at: new Date().toISOString(),
        customer_name: customerName || 'Walk-in Customer',
        customer_phone: cleanPhoneDigits || customerPhone,
        items: finalItems,
        subtotal,
        discount: discountAmt,
        gst: 0,
        total,
        payment_method: paymentMethod,
        billed_by: billedByName,
      };

      setCompletedOrderData(orderData);
      setBillNo(no);
      setBillGenerated(true);

      // Decrement product stocks locally
      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.qty) } : p;
      }));
    } catch (e: any) {
      console.error('Error generating bill:', e);
      alert('Error generating bill: ' + (e.message || 'Please try again'));
    } finally {
      setSaving(false);
    }
  };

  const handlePrintThermal = (width: '80mm' | '58mm' = thermalWidth) => {
    if (!completedOrderData) return;
    printThermalReceipt(completedOrderData, width, settings);
  };

  const handleDownloadA4PDF = async () => {
    if (!completedOrderData) return;
    await generateInvoicePDF(completedOrderData, true, settings);
  };

  const handleSendWhatsAppBill = () => {
    if (!completedOrderData) return;
    sendBillViaWhatsApp(completedOrderData, settings);
  };

  const resetBill = () => {
    setCart([]);
    setDiscount(0);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCustomerId(null);
    setCustomerLoyaltyPoints(null);
    setBillGenerated(false);
    setBillNo('');
    setCompletedOrderData(null);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>
            Billing & POS
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Instant invoice generation, thermal printing & WhatsApp receipts
          </p>
        </div>

        {/* Staff selector */}
        {staffList.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Cashier:</span>
            <select
              value={billedBy}
              onChange={e => setBilledBy(e.target.value)}
              style={{ border: 'none', background: 'none', fontWeight: 700, color: 'var(--color-plum)', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Mobile Tab Switcher */}
      <div className="pos-mobile-nav" style={{ display: 'none', gap: '8px', marginBottom: 'var(--space-3)' }}>
        <button
          onClick={() => setActiveMobileTab('menu')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeMobileTab === 'menu' ? 'var(--color-berry)' : 'var(--color-lavender)',
            color: activeMobileTab === 'menu' ? 'white' : 'var(--color-plum)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          Menu Catalogue
        </button>
        <button
          onClick={() => setActiveMobileTab('cart')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeMobileTab === 'cart' ? 'var(--color-berry)' : 'var(--color-lavender)',
            color: activeMobileTab === 'cart' ? 'white' : 'var(--color-plum)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          Cart ({cart.reduce((s, c) => s + c.qty, 0)}) · ₹{total}
        </button>
      </div>

      <div className="grid grid-3" style={{ gap: 'var(--space-4)', alignItems: 'start' }}>
        {/* PRODUCTS CATALOGUE (Left 2 cols) */}
        <div 
          className={`pos-menu-col ${activeMobileTab === 'cart' ? 'hide-mobile' : ''}`}
          style={{ gridColumn: 'span 2' }}
        >
          <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              className="input"
              placeholder="Search desserts, shakes, cakes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 44, background: 'white' }}
            />
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-3)', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                style={{
                  background: 'white',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                  cursor: p.stock <= 0 ? 'not-allowed' : 'pointer',
                  opacity: p.stock <= 0 ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all var(--transition-fast)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={e => { if (p.stock > 0) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { if (p.stock > 0) e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ position: 'relative', height: 110, background: 'var(--color-lavender)', width: '100%' }}>
                  <Image src={p.image || '/hot-chocolate.png'} alt={p.name} fill style={{ objectFit: 'cover' }} />
                  {p.stock <= 0 ? (
                    <span style={{ position: 'absolute', top: 6, right: 6, background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      Out of Stock
                    </span>
                  ) : p.stock < 5 ? (
                    <span style={{ position: 'absolute', top: 6, right: 6, background: '#f59e0b', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      {p.stock} left
                    </span>
                  ) : null}
                </div>
                <div style={{ padding: 'var(--space-3)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-plum)', marginBottom: '4px', lineHeight: 1.3 }}>
                      {p.name}
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                      {p.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-berry)', fontSize: '1rem' }}>
                      ₹{p.price}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); addToCart(p); }}
                      disabled={p.stock <= 0}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: 'var(--color-berry)',
                        border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: p.stock <= 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CART & BILLING PANEL (Right 1 col) */}
        <div 
          className={`pos-cart-col ${activeMobileTab === 'menu' ? 'hide-mobile' : ''}`}
          style={{ 
            background: 'white', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--color-border)', 
            display: 'flex', 
            flexDirection: 'column', 
            height: 'calc(100vh - 180px)', 
            boxShadow: 'var(--shadow-sm)',
            position: 'sticky',
            top: 20
          }}
        >
          {/* Customer CRM & Phone Section */}
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-lavender)', position: 'relative' }} ref={customerDropdownRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--color-plum)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} style={{ color: 'var(--color-berry)' }} />
                Customer CRM Details
              </label>

              {customerLoyaltyPoints !== null && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--color-plum)', fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '50px' }}>
                  <Star size={12} fill="var(--color-gold)" color="var(--color-gold)" />
                  {customerLoyaltyPoints} Pts
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Customer Name */}
              <input
                className="input"
                placeholder="Customer name (e.g. Priya Sharma)"
                value={customerName}
                onChange={e => { setCustomerName(e.target.value); setCustomerDropdownOpen(true); }}
                onFocus={() => setCustomerDropdownOpen(true)}
                id="bill-customer-name"
                style={{ fontSize: '0.85rem', padding: '8px 12px' }}
              />

              {/* Customer Phone + Direct WhatsApp Button */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="tel"
                    inputMode="tel"
                    className="input"
                    placeholder="10-digit WhatsApp phone"
                    value={customerPhone}
                    onChange={e => { handlePhoneChange(e.target.value); setCustomerDropdownOpen(true); }}
                    onFocus={() => setCustomerDropdownOpen(true)}
                    id="bill-customer-phone"
                    style={{ fontSize: '0.85rem', padding: '8px 12px', width: '100%' }}
                  />
                  {customerPhone && (
                    <button
                      type="button"
                      onClick={() => { setCustomerPhone(''); setCustomerName(''); setSelectedCustomerId(null); setCustomerLoyaltyPoints(null); }}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* DIRECT WHATSAPP CHAT BUTTON (Enabled for Indian numbers) */}
                <a
                  href={isIndianPhoneValid ? createWhatsAppUrl(customerPhone, `Hello ${customerName || ''}, welcome to Thirst.! We are pleased to serve you today.`) : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={isIndianPhoneValid ? `Chat with ${customerPhone} on WhatsApp` : 'Enter valid 10-digit number for WhatsApp chat'}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    background: isIndianPhoneValid ? '#25D366' : '#e2e8f0',
                    color: isIndianPhoneValid ? 'white' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: isIndianPhoneValid ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    textDecoration: 'none'
                  }}
                  onClick={e => { if (!isIndianPhoneValid) e.preventDefault(); }}
                >
                  <MessageCircle size={18} />
                </a>
              </div>
            </div>

            {/* Existing Customer Autocomplete Dropdown */}
            {customerDropdownOpen && filteredCustomers.length > 0 && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 16,
                  right: 16,
                  background: 'white',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  border: '1px solid var(--color-border)',
                  zIndex: 50,
                  maxHeight: 180,
                  overflowY: 'auto'
                }}
              >
                <div style={{ padding: '6px 10px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', background: 'var(--color-lavender)' }}>
                  Existing Registered Customers
                </div>
                {filteredCustomers.slice(0, 5).map(c => (
                  <div
                    key={c.id}
                    onClick={() => selectExistingCustomer(c)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8125rem'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-cream)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-plum)' }}>{c.name || 'Customer'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>+91 {c.phone}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-gold-dark)', fontWeight: 800 }}>
                        ★ {c.loyalty_points || 0} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)', minHeight: 0 }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>🍰</div>
                <p style={{ fontSize: '0.875rem' }}>Select products from the catalogue to add to bill</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'var(--color-lavender)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-plum)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div style={{ color: 'var(--color-berry)', fontSize: '0.75rem', fontWeight: 600 }}>
                        ₹{item.price} each
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 26, height: 26, borderRadius: '50%', background: 'white', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, minWidth: 20, textAlign: 'center', fontSize: '0.9rem' }}>
                        {item.qty}
                      </span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-berry)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '0.9rem', minWidth: 50, textAlign: 'right' }}>
                      ₹{item.price * item.qty}
                    </div>
                    <button onClick={() => updateQty(item.id, 0)} style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals & Actions Panel */}
          <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-lavender)', background: 'white', flexShrink: 0 }}>
            {/* Discount */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: '8px' }}>
              <label style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                Discount %:
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={discount}
                onChange={e => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="input"
                style={{ padding: '6px 10px', fontSize: '0.85rem', width: 80 }}
                id="bill-discount"
              />
            </div>

            {/* Subtotal & Total */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                <span>Subtotal</span><span>₹{subtotal}</span>
              </div>
              {discountAmt > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#dc2626' }}>
                  <span>Discount ({discount}%)</span><span>-₹{discountAmt}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.2rem', borderTop: '1px dashed var(--color-border)', paddingTop: '6px' }}>
                <span>TOTAL</span><span>₹{total}</span>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              {(['cash', 'upi', 'card'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  style={{
                    flex: 1,
                    padding: '8px 2px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid',
                    borderColor: paymentMethod === m ? 'var(--color-berry)' : 'var(--color-border)',
                    background: paymentMethod === m ? 'rgba(217, 79, 138, 0.12)' : 'white',
                    color: paymentMethod === m ? 'var(--color-berry)' : 'var(--color-text-muted)',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* POST-BILL GENERATED ACTIONS */}
            {billGenerated ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '10px 12px', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Check size={18} /> Invoice #{billNo} Generated
                </div>

                {/* Thermal Bill Print Buttons */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handlePrintThermal('80mm')}
                    className="btn btn-primary"
                    style={{ flex: 2, justifyContent: 'center', padding: '10px 8px', fontSize: '0.85rem' }}
                    title="Print on standard 80mm POS receipt printer"
                  >
                    <Printer size={16} /> Print Thermal (80mm)
                  </button>
                  <button
                    onClick={() => handlePrintThermal('58mm')}
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', padding: '10px 6px', fontSize: '0.8rem' }}
                    title="Print on 58mm compact POS roll"
                  >
                    58mm
                  </button>
                </div>

                {/* Send via WhatsApp Button */}
                <button
                  onClick={handleSendWhatsAppBill}
                  className="btn"
                  style={{
                    background: '#25D366',
                    color: 'white',
                    justifyContent: 'center',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <MessageCircle size={18} /> Send via WhatsApp
                </button>

                {/* Download A4 PDF Invoice & New Bill */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handleDownloadA4PDF}
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.8rem' }}
                  >
                    <Download size={14} /> Download A4
                  </button>
                  <button
                    onClick={resetBill}
                    className="btn btn-ghost"
                    style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.8rem', color: 'var(--color-plum)' }}
                  >
                    New Bill
                  </button>
                </div>
              </div>
            ) : (
              /* IMMEDIATE GENERATE BILL BUTTON */
              <button
                onClick={handleGenerateBill}
                disabled={cart.length === 0 || saving}
                className="btn btn-primary w-full"
                style={{
                  justifyContent: 'center',
                  fontSize: '1rem',
                  padding: '14px',
                  opacity: cart.length === 0 ? 0.6 : 1,
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <Printer size={18} />
                {saving ? 'Generating...' : `Generate Bill (₹${total})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
