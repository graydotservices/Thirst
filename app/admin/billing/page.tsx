'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, Printer, MessageCircle, Download, Check } from 'lucide-react';
import Image from 'next/image';
import { generateInvoicePDF, generateInvoiceImage } from '@/lib/pdfUtils';
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

export default function BillingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billGenerated, setBillGenerated] = useState(false);
  const [billNo, setBillNo] = useState('');
  const [upiStep, setUpiStep] = useState<'none' | 'scanning'>('none');
  const [upiRefId, setUpiRefId] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [billedBy, setBilledBy] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'menu' | 'cart'>('menu');

  // Fetch products and active staff
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
    
    fetchProducts();
    fetchStaff();
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const generatePDF = async () => {
    await generateInvoicePDF({
      bill_no: billNo,
      created_at: new Date().toISOString(),
      customer_name: customerName,
      customer_phone: customerPhone,
      items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price, total: c.price * c.qty })),
      subtotal,
      discount: discountAmt,
      gst: 0,
      total,
      payment_method: paymentMethod === 'upi' && upiRefId ? `UPI (Ref: ${upiRefId})` : paymentMethod
    });
  };

  // Auto-fetch existing customer name by phone number
  useEffect(() => {
    if (customerPhone.length >= 10) {
      const checkCustomer = async () => {
        const { data } = await supabase
          .from('customers')
          .select('name')
          .eq('phone', customerPhone)
          .single();
        if (data && data.name) {
          setCustomerName(data.name);
        }
      };
      checkCustomer();
    }
  }, [customerPhone]);

  const handleGenerateBill = async () => {
    if (cart.length === 0 || saving) return;
    setSaving(true);

    try {
      // Calculate date in Indian Standard Time (IST UTC+5:30)
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

      // Upsert customer
      let customerId: string | null = null;
      let currentPoints = 0;
      let currentTotalPurchase = 0;

      if (customerPhone && customerPhone.trim() !== '') {
        const { data: customer } = await supabase
          .from('customers')
          .upsert(
            {
              phone: customerPhone.trim(),
              name: customerName.trim() || 'Walk-in',
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

      // Clean item list without polluting with meta_staff
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
        p_customer_phone: customerPhone || '0000000000',
        p_customer_id: customerId,
        p_items: finalItems,
        p_subtotal: subtotal,
        p_discount: discountAmt,
        p_gst: 0,
        p_total: total,
        p_payment_method: paymentMethod,
        p_payment_ref: upiRefId || null,
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
            customer_phone: customerPhone || '0000000000',
            customer_id: customerId,
            items: finalItems,
            subtotal,
            discount: discountAmt,
            gst: 0,
            total,
            payment_method: paymentMethod,
            payment_ref: upiRefId || null,
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

      setBillNo(no);
      setBillGenerated(true);
      setUpiStep('none');

      // Update local product stocks
      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.qty) } : p;
      }));
    } catch (e: any) {
      console.error('Error generating bill:', e);
      alert('Error generating invoice: ' + (e.message || 'Please try again'));
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsApp = async () => {
    const rawDigits = customerPhone.replace(/[^\d]/g, '');
    const formattedPhone = rawDigits.length === 10 ? '91' + rawDigits : rawDigits;
    const itemListText = cart.map(item => `- ${item.qty} x ${item.name}`).join('\n');
    const msg = `Hi ${customerName || 'Valued Customer'},\n\nThank you for visiting *Thirst.*!\n\n*Invoice No:* ${billNo}\n*Date:* ${new Date().toLocaleDateString('en-IN')}\n\n*Order Details:*\n${itemListText}\n\n*Total Amount:* ₹${total}\n\nHope to see you again! ❤\n\n— Thirst. Team`;
    
    try {
      const orderData = {
        bill_no: billNo,
        created_at: new Date().toISOString(),
        customer_name: customerName,
        customer_phone: customerPhone,
        items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price, total: c.price * c.qty })),
        subtotal,
        discount: discountAmt,
        gst: 0,
        total,
        payment_method: paymentMethod === 'upi' && upiRefId ? `UPI (Ref: ${upiRefId})` : paymentMethod
      };
      
      const blob = await generateInvoiceImage(orderData);
      
      if (blob) {
        const file = new File([blob], `Thirst_Invoice_${billNo}.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Thirst Invoice ${billNo}`,
            text: msg,
          });
          return;
        }
      }
      
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (e) {
      console.error('Error sharing:', e);
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const resetBill = () => {
    setCart([]);
    setDiscount(0);
    setCustomerName('');
    setCustomerPhone('');
    setBillGenerated(false);
    setBillNo('');
    setUpiStep('none');
    setUpiRefId('');
  };

  const handleProceed = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'upi') {
      setUpiStep('scanning');
    } else {
      handleGenerateBill();
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Billing & POS</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Create invoices and process payments</p>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="pos-mobile-nav" style={{ display: 'none', marginBottom: 'var(--space-4)', gap: '8px' }}>
        <button
          onClick={() => setActiveMobileTab('menu')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: activeMobileTab === 'menu' ? 'var(--color-berry)' : 'white',
            color: activeMobileTab === 'menu' ? 'white' : 'var(--color-plum)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease',
          }}
        >
          Menu & Products
        </button>
        <button
          onClick={() => setActiveMobileTab('cart')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: activeMobileTab === 'cart' ? 'var(--color-berry)' : 'white',
            color: activeMobileTab === 'cart' ? 'white' : 'var(--color-plum)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>Current Bill</span>
          {cart.length > 0 && (
            <span style={{
              background: activeMobileTab === 'cart' ? 'white' : 'var(--color-berry)',
              color: activeMobileTab === 'cart' ? 'var(--color-berry)' : 'white',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)'
            }}>
              {cart.reduce((s, c) => s + c.qty, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="pos-grid" style={{ alignItems: 'start' }}>
        {/* Left: Products */}
        <div className={`pos-left ${activeMobileTab === 'cart' ? 'mobile-hidden' : ''}`}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              id="pos-search"
              className="input"
              placeholder="Search products by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 44, background: 'white' }}
            />
          </div>

          {/* Product Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--space-3)', maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', paddingRight: 4 }}>
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                style={{
                  background: 'white',
                  border: '1px solid var(--color-lavender-dark)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-3)',
                  cursor: p.stock > 0 ? 'pointer' : 'not-allowed',
                  opacity: p.stock > 0 ? 1 : 0.6,
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onMouseEnter={e => { 
                  if (p.stock > 0) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-berry)'; 
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(217, 79, 138, 0.15)'; 
                  }
                }}
                onMouseLeave={e => { 
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-lavender-dark)'; 
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; 
                }}
              >
                <div style={{ position: 'relative', paddingBottom: '70%', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-2)', background: 'var(--color-lavender)' }}>
                  <Image src={p.image || '/cake-product.png'} alt={p.name} fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-plum)', marginBottom: '2px', lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-berry)', fontWeight: 700, fontSize: '0.875rem' }}>₹{p.price}</span>
                  <span style={{ fontSize: '0.75rem', color: p.stock <= 5 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                    {p.stock > 0 ? `${p.stock} left` : 'Out of stock'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Bill */}
        <div className={`pos-right ${activeMobileTab === 'menu' ? 'mobile-hidden' : ''}`} style={{ background: 'white', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', minHeight: '600px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-lavender-dark)' }}>
          {/* Header */}
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-lavender)', flexShrink: 0 }}>
            {/* Mobile Back Button */}
            <div className="mobile-only" style={{ marginBottom: '10px' }}>
              <button
                onClick={() => setActiveMobileTab('menu')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
              >
                ← Back to Menu
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1rem' }}>Current Bill</h3>
              
              <select 
                value={billedBy} 
                onChange={e => setBilledBy(e.target.value)}
                style={{ fontSize: '0.8125rem', padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-lavender-dark)', background: 'var(--color-cream)', outline: 'none', color: 'var(--color-plum)', fontWeight: 600 }}
              >
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-3)' }}>
              <input className="input" placeholder="Customer name" value={customerName} onChange={e => setCustomerName(e.target.value)} id="bill-customer-name" style={{ fontSize: '0.875rem', padding: '10px 14px' }} />
              <input type="tel" inputMode="tel" className="input" placeholder="Phone number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} id="bill-customer-phone" style={{ fontSize: '0.875rem', padding: '10px 14px' }} />
            </div>
          </div>

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', minHeight: 0 }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-10) 0', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🛒</div>
                <p>Select products from the menu to add to bill</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-lavender)', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-plum)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ color: 'var(--color-berry)', fontSize: '0.8125rem', fontWeight: 600 }}>₹{item.price} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 34, height: 34, borderRadius: '50%', background: 'white', border: '1px solid var(--color-soft-pink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-plum)' }}>
                        <Minus size={14} />
                      </button>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', minWidth: 28, textAlign: 'center', fontSize: '1rem' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--color-berry)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.95rem', minWidth: 64, textAlign: 'right' }}>
                      ₹{item.price * item.qty}
                    </div>
                    <button onClick={() => updateQty(item.id, 0)} style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-lavender)', flexShrink: 0, background: 'white' }}>
            {/* Discount */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <label style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                Discount %
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={discount}
                onChange={e => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="input"
                style={{ padding: '8px 12px', fontSize: '0.875rem' }}
                id="bill-discount"
              />
            </div>

            {/* Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: 'var(--space-4)' }}>
              {[
                { label: 'Subtotal', value: `₹${subtotal}` },
                { label: `Discount (${discount}%)`, value: discountAmt > 0 ? `-₹${discountAmt}` : '₹0' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  <span>{label}</span><span>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.25rem', borderTop: '1px solid var(--color-lavender)', paddingTop: '8px', marginTop: '4px' }}>
                <span>TOTAL</span><span>₹{total}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-4)' }}>
              {(['cash', 'upi'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 'var(--radius-md)', border: '1.5px solid',
                    borderColor: paymentMethod === m ? 'var(--color-berry)' : 'var(--color-lavender-dark)',
                    background: paymentMethod === m ? 'rgba(217, 79, 138, 0.1)' : 'transparent',
                    color: paymentMethod === m ? 'var(--color-berry)' : 'var(--color-text-muted)',
                    fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.75rem',
                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.03em',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Actions */}
            {billGenerated ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', textAlign: 'center', color: '#16a34a', fontFamily: 'var(--font-heading)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <Check size={16} /> Bill Generated: {billNo}
                </div>
                <button onClick={generatePDF} className="btn btn-secondary" style={{ justifyContent: 'center' }}><Download size={16} /> Download PDF</button>
                {customerPhone && (
                  <button onClick={handleWhatsApp} className="btn" style={{ background: '#25D366', color: 'white', justifyContent: 'center', borderRadius: 'var(--radius-full)', padding: '12px', fontWeight: 600 }}>
                    <MessageCircle size={16} /> Send on WhatsApp
                  </button>
                )}
                <button onClick={resetBill} className="btn btn-ghost" style={{ justifyContent: 'center', color: 'var(--color-plum)' }}>New Bill</button>
              </div>
            ) : upiStep === 'scanning' ? (
              <div style={{ background: 'var(--color-lavender)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.125rem' }}>Scan to Pay ₹{total}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>UPI ID: thirstshop@upi</div>
                </div>
                
                <div style={{ background: 'white', padding: '10px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=thirstshop@upi&pn=Thirst&am=${total}&cu=INR`)}`} 
                    alt="UPI QR Code" 
                    style={{ width: 180, height: 180 }} 
                  />
                </div>

                <div style={{ width: '100%', marginTop: 'var(--space-2)' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 600 }}>UPI Reference / UTR Number (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Enter 12-digit UTR" 
                    className="input" 
                    value={upiRefId}
                    onChange={e => setUpiRefId(e.target.value)}
                    style={{ width: '100%', background: 'white', textAlign: 'center', letterSpacing: '2px', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%' }}>
                  <button onClick={() => setUpiStep('none')} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button onClick={handleGenerateBill} disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#16a34a', borderColor: '#16a34a' }}>
                    {saving ? 'Processing...' : <><Check size={16} /> Confirm Payment</>}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleProceed}
                disabled={cart.length === 0 || saving}
                className="btn btn-primary w-full"
                style={{ 
                  justifyContent: 'center', 
                  fontSize: '1rem',
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

      {/* Mobile Floating Cart Summary */}
      {cart.length > 0 && activeMobileTab === 'menu' && (
        <div
          className="pos-floating-bar"
          style={{
            position: 'fixed',
            bottom: 20,
            left: 16,
            right: 16,
            background: 'var(--color-plum)',
            color: 'white',
            borderRadius: 'var(--radius-xl)',
            padding: '12px 18px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: 90,
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem' }}>
              {cart.reduce((s, c) => s + c.qty, 0)} items · ₹{total}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
              Tap to review & process bill
            </div>
          </div>
          <button
            onClick={() => {
              setActiveMobileTab('cart');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="btn btn-primary btn-sm"
            style={{
              padding: '8px 16px',
              fontWeight: 700,
            }}
          >
            View Bill →
          </button>
        </div>
      )}
    </div>
  );
}
