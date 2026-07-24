'use client';

import { useState, useRef } from 'react';
import { Search, Plus, Minus, Trash2, Printer, MessageCircle, Download, Check } from 'lucide-react';
import Image from 'next/image';
import jsPDF from 'jspdf';

type CartItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
  category: string;
};

const products = [
  { id: 1, name: 'Rose Velvet Cake', price: 850, category: 'Cake', image: '/cake-product.png' },
  { id: 2, name: 'Midnight Cheesecake', price: 1200, category: 'Cake', image: '/cake-product.png' },
  { id: 3, name: 'Berry Blast Scoop', price: 320, category: 'Ice Cream', image: '/icecream-product.png' },
  { id: 4, name: 'Plum Royale Cone', price: 280, category: 'Ice Cream', image: '/icecream-product.png' },
  { id: 5, name: 'Saffron Kulfi Cup', price: 220, category: 'Ice Cream', image: '/icecream-product.png' },
  { id: 6, name: 'Gold Parfait', price: 480, category: 'Special', image: '/special-dessert.png' },
  { id: 7, name: 'Plum Mousse Cup', price: 380, category: 'Special', image: '/special-dessert.png' },
  { id: 8, name: 'Waffles Royale', price: 540, category: 'Special', image: '/special-dessert.png' },
  { id: 9, name: 'Golden Tiramisu', price: 950, category: 'Cake', image: '/cake-product.png' },
];

const GST_RATE = 0.05;

export default function BillingPage() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'split'>('upi');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billGenerated, setBillGenerated] = useState(false);
  const [billNo, setBillNo] = useState('');
  const billRef = useRef<HTMLDivElement>(null);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: (typeof products)[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(c => c.id !== id));
    else setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c));
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmt = Math.round(subtotal * (discount / 100));
  const taxable = subtotal - discountAmt;
  const gstAmt = Math.round(taxable * GST_RATE);
  const total = taxable + gstAmt;

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(74, 13, 51);
    doc.text('THIRST.', 105, 25, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('One For Living', 105, 33, { align: 'center' });
    doc.text('12 Sweet Lane, Bandra West, Mumbai', 105, 40, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.line(15, 45, 195, 45);

    doc.text(`Bill No: ${billNo}`, 15, 55);
    doc.text(`Date: ${new Date().toLocaleString('en-IN')}`, 105, 55, { align: 'right' });
    doc.text(`Customer: ${customerName || 'Walk-in'}`, 15, 63);
    doc.text(`Phone: ${customerPhone || '-'}`, 105, 63, { align: 'right' });

    doc.line(15, 68, 195, 68);

    let y = 78;
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 15, y);
    doc.text('Qty', 110, y);
    doc.text('Price', 135, y);
    doc.text('Total', 165, y);
    doc.setFont('helvetica', 'normal');

    y += 8;
    doc.line(15, y - 2, 195, y - 2);

    for (const item of cart) {
      doc.text(item.name, 15, y);
      doc.text(String(item.qty), 110, y);
      doc.text(`₹${item.price}`, 135, y);
      doc.text(`₹${item.price * item.qty}`, 165, y);
      y += 9;
    }

    doc.line(15, y, 195, y);
    y += 10;
    doc.text(`Subtotal: ₹${subtotal}`, 130, y, { align: 'left' });
    y += 8;
    doc.text(`Discount (${discount}%): -₹${discountAmt}`, 130, y);
    y += 8;
    doc.text(`GST (5%): ₹${gstAmt}`, 130, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(74, 13, 51);
    doc.text(`TOTAL: ₹${total}`, 130, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Payment: ${paymentMethod.toUpperCase()}`, 130, y);

    y += 20;
    doc.setTextColor(217, 79, 138);
    doc.text('Thank you for visiting Thirst.! ❤', 105, y, { align: 'center' });

    doc.save(`${billNo}.pdf`);
    return doc;
  };

  const handleGenerateBill = async () => {
    if (cart.length === 0) return;
    const no = `TH-${Date.now().toString().slice(-8)}`;
    setBillNo(no);
    setBillGenerated(true);

    // Save to Supabase
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName || 'Walk-in',
          customer_phone: customerPhone || '0000000000',
          items: cart.map(c => ({ product_id: String(c.id), name: c.name, price: c.price, qty: c.qty, total: c.price * c.qty })),
          subtotal, discount: discountAmt, gst: gstAmt, total,
          payment_method: paymentMethod,
          bill_no: no,
        }),
      });
    } catch { /* continue */ }
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
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Billing & POS</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Create invoices and process payments</p>
      </div>

      <div className="pos-grid">
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
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-lavender-dark)' }}>
          {/* Header */}
          <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-lavender)', flexShrink: 0 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', marginBottom: 'var(--space-4)', fontSize: '1rem' }}>Current Bill</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <input className="input" placeholder="Customer name" value={customerName} onChange={e => setCustomerName(e.target.value)} id="bill-customer-name" style={{ fontSize: '0.875rem', padding: '10px 14px' }} />
              <input className="input" placeholder="Phone number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} id="bill-customer-phone" style={{ fontSize: '0.875rem', padding: '10px 14px' }} />
            </div>
          </div>

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-10) 0', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🛒</div>
                <p>Add products from the left panel</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-lavender)', borderRadius: 'var(--radius-md)' }}>
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
                { label: 'GST (5%)', value: `₹${gstAmt}` },
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
              {(['cash', 'upi', 'card', 'split'] as const).map(m => (
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
            ) : (
              <button
                onClick={handleGenerateBill}
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
