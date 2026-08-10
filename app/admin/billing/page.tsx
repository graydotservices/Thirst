'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, Printer, MessageCircle, Download, Check } from 'lucide-react';
import Image from 'next/image';
import { generateInvoicePDF } from '@/lib/pdfUtils';
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

const GST_RATE = 0;

export default function BillingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('upi');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billGenerated, setBillGenerated] = useState(false);
  const [billNo, setBillNo] = useState('');
  const [publicPdfUrl, setPublicPdfUrl] = useState('');
  const [upiStep, setUpiStep] = useState<'none' | 'scanning'>('none');
  const [upiRefId, setUpiRefId] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [billedBy, setBilledBy] = useState('');

  // Fetch products
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
      let { data } = await supabase.from('staff').select('*');
      if (!data || data.length === 0) {
        // Seed dummy staff if empty
        await supabase.from('staff').insert([
          { name: 'Admin (Owner)', role: 'admin' },
          { name: 'Priya Sharma', role: 'cashier' },
          { name: 'Rahul Desai', role: 'manager' }
        ]);
        const res = await supabase.from('staff').select('*');
        data = res.data;
      }
      if (data) {
        setStaffList(data);
        if (data.length > 0) setBilledBy(data[0].id);
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
      if (existing) return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(c => c.id !== id));
    else setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c));
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmt = Math.round(subtotal * (discount / 100));
  const taxable = subtotal - discountAmt;
  const total = taxable;

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
    if (cart.length === 0) return;
    
    // Create meaningful bill number: TH-YYYYMMDD-SEQ
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const dateCode = todayStr.replace(/-/g, ''); // YYYYMMDD
    
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${todayStr}T00:00:00.000Z`)
      .lte('created_at', `${todayStr}T23:59:59.999Z`);
      
    const seq = ((count || 0) + 1).toString().padStart(3, '0');
    const no = `TH-${dateCode}-${seq}`;
    
    setBillNo(no);
    setBillGenerated(true);
    setUpiStep('none');

    // Save to Supabase directly using authenticated client
    try {
      // 1. Upsert customer
      let customerId = null;
      let currentPoints = 0;
      let currentTotalPurchase = 0;

      if (customerPhone && customerPhone.trim() !== '') {
        const { data: customer } = await supabase
          .from('customers')
          .upsert(
            {
              phone: customerPhone,
              name: customerName || 'Walk-in',
              last_visit: new Date().toISOString(),
            },
            { onConflict: 'phone', ignoreDuplicates: false }
          )
          .select()
          .single();
          
        if (customer) {
          customerId = customer.id;
          currentPoints = customer.loyalty_points || 0;
          currentTotalPurchase = customer.total_purchase || 0;
        }
      }

      // 2. Create order with staff metadata injected into items
      const selectedStaff = staffList.find(s => s.id === billedBy);
      const staffMeta = selectedStaff ? { 
        product_id: 'meta_staff', 
        name: `Billed by: ${selectedStaff.name} (${selectedStaff.role})`, 
        price: 0, qty: 0, total: 0 
      } : null;
      
      const finalItems = cart.map(c => ({ product_id: String(c.id), name: c.name, price: c.price, qty: c.qty, total: c.price * c.qty }));
      if (staffMeta) finalItems.push(staffMeta);

      await supabase
        .from('orders')
        .insert([{
          customer_name: customerName || 'Walk-in',
          customer_phone: customerPhone || '0000000000',
          items: finalItems,
          subtotal, discount: discountAmt, gst: 0, total,
          payment_method: paymentMethod === 'upi' && upiRefId ? `UPI (Ref: ${upiRefId})` : paymentMethod,
          bill_no: no,
          customer_id: customerId,
          status: 'completed',
        }]);

      // 3. Update loyalty points
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

      // 4. Decrement stock
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
    } catch (e) {
      console.error('Error saving order:', e);
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hi ${customerName || 'Valued Customer'},\n\nThank you for visiting *Thirst.*!\n\nInvoice No: ${billNo}\nDate: ${new Date().toLocaleDateString('en-IN')}\nAmount: ₹${total}\n\nYour invoice is ready. Hope to see you again! ❤\n\n— Thirst. Team`
    );
    window.open(`https://wa.me/${customerPhone}?text=${msg}`, '_blank');
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
    if (paymentMethod === 'upi') {
      setUpiStep('scanning');
    } else {
      handleGenerateBill();
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Billing & POS</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Create invoices and process payments</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Left: Products */}
        <div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)', maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', paddingRight: 4 }}>
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                style={{
                  background: 'white',
                  border: '1px solid var(--color-lavender-dark)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-3)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-berry)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(217,79,138,0.15)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-lavender-dark)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <div style={{ position: 'relative', paddingBottom: '70%', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-2)', background: 'var(--color-lavender)' }}>
                  <Image src={p.image} alt={p.name} fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-plum)', marginBottom: '2px', lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ color: 'var(--color-berry)', fontWeight: 700, fontSize: '0.875rem' }}>₹{p.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Bill */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', minHeight: '600px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-lavender-dark)' }}>
          {/* Header */}
          <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-lavender)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
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
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <input className="input" placeholder="Customer name" value={customerName} onChange={e => setCustomerName(e.target.value)} id="bill-customer-name" style={{ fontSize: '0.875rem', padding: '10px 14px' }} />
              <input className="input" placeholder="Phone number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} id="bill-customer-phone" style={{ fontSize: '0.875rem', padding: '10px 14px' }} />
            </div>
          </div>

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', minHeight: 0 }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-10) 0', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🛒</div>
                <p>Add products from the left panel</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-lavender)', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-plum)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ color: 'var(--color-berry)', fontSize: '0.8125rem', fontWeight: 600 }}>₹{item.price} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 26, height: 26, borderRadius: '50%', background: 'white', border: '1px solid var(--color-soft-pink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-plum)' }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', minWidth: 24, textAlign: 'center', fontSize: '0.9rem' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-berry)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.9rem', minWidth: 64, textAlign: 'right' }}>
                      ₹{item.price * item.qty}
                    </div>
                    <button onClick={() => updateQty(item.id, 0)} style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={15} />
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
                onChange={e => setDiscount(Number(e.target.value))}
                className="input"
                style={{ padding: '8px 12px', fontSize: '0.875rem' }}
                id="bill-discount"
              />
            </div>

            {/* Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: 'var(--space-4)' }}>
              {[
                { label: 'Subtotal', value: `₹${subtotal}` },
                { label: `Discount (${discount}%)`, value: `-₹${discountAmt}` },
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
                    background: paymentMethod === m ? 'rgba(217,79,138,0.1)' : 'transparent',
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
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', textAlign: 'center', color: '#16a34a', fontFamily: 'var(--font-heading)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem' }}>
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
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 600 }}>UPI Reference Number (Optional)</label>
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
                  <button onClick={handleGenerateBill} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#16a34a', borderColor: '#16a34a' }}><Check size={16} /> Confirm Payment</button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleProceed}
                disabled={cart.length === 0}
                className="btn btn-primary w-full"
                style={{ justifyContent: 'center', fontSize: '1rem' }}
              >
                <Printer size={18} />
                Generate Bill (₹{total})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
