'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Receipt, Calendar, CreditCard, ChevronRight, X, Download, Trash2, MessageCircle, Printer } from 'lucide-react';
import { generateInvoicePDF, generateInvoiceImage, printThermalReceipt, sendBillViaWhatsApp, OrderData } from '@/lib/pdfUtils';

type Order = {
  id: string;
  bill_no: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  billed_by?: string;
  items: Array<{ product_id?: string; name: string; qty: number; price: number; total: number }>;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data as Order[]);
    setLoading(false);
  };

  const cancelOrder = async (order: Order) => {
    if (order.status === 'cancelled') {
      alert('This order is already marked as cancelled.');
      return;
    }
    if (window.confirm(`Are you sure you want to void/cancel Bill #${order.bill_no}? This will mark the order as Cancelled.`)) {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);

      if (error) {
        alert(`Failed to update order status: ${error.message}`);
      } else {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
      }
    }
  };

  const handleWhatsApp = async (order: Order) => {
    if (!order.customer_phone || order.customer_phone === '0000000000') {
      alert('No valid phone number found for this customer.');
      return;
    }
    const rawDigits = order.customer_phone.replace(/[^\d]/g, '');
    const formattedPhone = rawDigits.length === 10 ? '91' + rawDigits : rawDigits;

    const regularItems = (order.items || []).filter(item => 
      (item as any).product_id !== 'meta_staff' && (!item.name || !item.name.startsWith('Billed by:'))
    );
    const itemListText = regularItems.map(item => `- ${item.qty} x ${item.name}`).join('\n');
    const msg = `Hi ${order.customer_name || 'Valued Customer'},\n\nThank you for visiting *Thirst.*!\n\n*Invoice No:* ${order.bill_no}\n*Date:* ${new Date(order.created_at).toLocaleDateString('en-IN')}\n\n*Order Details:*\n${itemListText}\n\n*Total Amount:* ₹${order.total}\n\nHope to see you again! ❤\n\n— Thirst. Team`;
    
    try {
      const orderData = {
        bill_no: order.bill_no,
        created_at: order.created_at,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        items: regularItems,
        subtotal: order.subtotal || order.total,
        discount: order.discount || 0,
        gst: 0,
        total: order.total,
        payment_method: order.payment_method
      };
      
      const blob = await generateInvoiceImage(orderData);
      
      if (blob) {
        const file = new File([blob], `Thirst_Invoice_${order.bill_no}.jpg`, { type: 'image/jpeg' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Thirst Invoice ${order.bill_no}`,
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

  const filtered = orders.filter(o => {
    const matchesSearch = (o.bill_no && o.bill_no.toLowerCase().includes(search.toLowerCase())) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (o.customer_phone && o.customer_phone.includes(search));
    const matchesStatus = statusFilter === 'all'
      ? true
      : statusFilter === 'cancelled'
        ? o.status === 'cancelled'
        : o.status !== 'cancelled';
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Order History</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{orders.length} total orders processed</p>
        </div>
      </div>

      {/* Search and Status Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 260px)', maxWidth: 440 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input 
            className="input" 
            placeholder="Search by bill number, name or phone..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 44, background: 'white' }}
          />
        </div>

        <div className="admin-tab-bar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
          {[
            { id: 'all', label: `All (${orders.length})` },
            { id: 'completed', label: `Completed (${orders.filter(o => o.status !== 'cancelled').length})` },
            { id: 'cancelled', label: `Voided (${orders.filter(o => o.status === 'cancelled').length})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id as any)}
              className={`btn btn-sm ${statusFilter === t.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem', padding: '7px 14px' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th>Bill No.</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)' }}><span className="spinner"></span></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>No orders found.</td></tr>
            ) : filtered.map(order => {
              const staffMeta = (order.items || []).find(item => (item as any).product_id === 'meta_staff' || (item.name && item.name.startsWith('Billed by:')));
              const billedByText = order.billed_by || (staffMeta ? staffMeta.name : null);
              const cleanItems = (order.items || []).filter(item => (item as any).product_id !== 'meta_staff' && (!item.name || !item.name.startsWith('Billed by:')));
              const totalQty = cleanItems.reduce((acc, item) => acc + (Number(item.qty) || 1), 0);

              return (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--color-lavender)' }}>
                  <td>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-plum)' }}>{order.bill_no}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {new Date(order.created_at).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    {billedByText && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-berry)', marginTop: '4px', fontWeight: 600 }}>
                        {billedByText.startsWith('Billed by:') ? billedByText : `Billed by: ${billedByText}`}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{order.customer_name || 'Walk-in'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {(!order.customer_phone || order.customer_phone === '0000000000') ? '—' : order.customer_phone}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>
                    {totalQty} {totalQty === 1 ? 'item' : 'items'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-berry)' }}>
                    ₹{Number(order.total).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span className="badge" style={{ 
                      background: 'rgba(217, 79, 138, 0.1)', 
                      color: 'var(--color-berry)', 
                      textTransform: 'uppercase', 
                      fontSize: '0.7rem' 
                    }}>
                      {order.payment_method}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${order.status === 'completed' ? 'badge-success' : order.status === 'cancelled' ? 'badge-error' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>
                      {order.status || 'Completed'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="btn btn-secondary btn-sm" 
                        style={{ padding: '6px 10px' }}
                      >
                        View <ChevronRight size={13} />
                      </button>
                      <button
                        onClick={() => printThermalReceipt({
                          bill_no: order.bill_no,
                          created_at: order.created_at,
                          customer_name: order.customer_name,
                          customer_phone: order.customer_phone,
                          items: (order.items || []).filter(item => (item as any).product_id !== 'meta_staff' && (!item.name || !item.name.startsWith('Billed by:'))),
                          subtotal: order.subtotal || order.total,
                          discount: order.discount || 0,
                          gst: 0,
                          total: order.total,
                          payment_method: order.payment_method,
                          billed_by: order.billed_by
                        }, '80mm')}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 8px' }}
                        title="Quick Print Thermal Receipt (80mm)"
                      >
                        <Printer size={14} />
                      </button>
                      {order.status !== 'cancelled' ? (
                        <button 
                          onClick={() => cancelOrder(order)}
                          className="btn btn-sm" 
                          style={{ padding: '6px 8px', background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.2)', cursor: 'pointer' }}
                          title="Void / Cancel Order"
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', padding: '4px 6px' }}>
                          Voided
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-lavender)', paddingBottom: 'var(--space-3)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.25rem' }}>
                  Invoice Details
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{selectedOrder.bill_no}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Customer Info */}
              <div style={{ background: 'var(--color-lavender)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '4px' }}>Customer Info</div>
                <div style={{ fontSize: '0.875rem' }}>Name: {selectedOrder.customer_name || 'Walk-in'}</div>
                <div style={{ fontSize: '0.875rem' }}>Phone: {(!selectedOrder.customer_phone || selectedOrder.customer_phone === '0000000000') ? '—' : selectedOrder.customer_phone}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Date: {new Date(selectedOrder.created_at).toLocaleString('en-IN')}</div>
              </div>

              {/* Items Purchased */}
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '8px' }}>Items Purchased</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {(selectedOrder.items || [])
                    .filter(item => (item as any).product_id !== 'meta_staff' && (!item.name || !item.name.startsWith('Billed by:')))
                    .map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', borderBottom: '1px dashed var(--color-lavender)', paddingBottom: '4px' }}>
                        <span>{item.qty} x {item.name}</span>
                        <span style={{ fontWeight: 600 }}>₹{item.price * item.qty}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div style={{ borderTop: '1px solid var(--color-lavender)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal || selectedOrder.total}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-success)' }}>
                    <span>Discount</span>
                    <span>-₹{selectedOrder.discount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.125rem', color: 'var(--color-berry)', marginTop: '4px' }}>
                  <span>Total</span>
                  <span>₹{selectedOrder.total}</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Paid via: <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{selectedOrder.payment_method}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => printThermalReceipt({
                      bill_no: selectedOrder.bill_no,
                      created_at: selectedOrder.created_at,
                      customer_name: selectedOrder.customer_name,
                      customer_phone: selectedOrder.customer_phone,
                      items: (selectedOrder.items || []).filter(item => (item as any).product_id !== 'meta_staff' && (!item.name || !item.name.startsWith('Billed by:'))),
                      subtotal: selectedOrder.subtotal || selectedOrder.total,
                      discount: selectedOrder.discount || 0,
                      gst: 0,
                      total: selectedOrder.total,
                      payment_method: selectedOrder.payment_method,
                      billed_by: selectedOrder.billed_by
                    }, '80mm')}
                    className="btn btn-primary" 
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Printer size={16} /> Thermal Bill (80mm)
                  </button>
                  <button 
                    onClick={() => generateInvoicePDF({
                      bill_no: selectedOrder.bill_no,
                      created_at: selectedOrder.created_at,
                      customer_name: selectedOrder.customer_name,
                      customer_phone: selectedOrder.customer_phone,
                      items: (selectedOrder.items || []).filter(item => (item as any).product_id !== 'meta_staff' && (!item.name || !item.name.startsWith('Billed by:'))),
                      subtotal: selectedOrder.subtotal || selectedOrder.total,
                      discount: selectedOrder.discount || 0,
                      gst: 0,
                      total: selectedOrder.total,
                      payment_method: selectedOrder.payment_method,
                      billed_by: selectedOrder.billed_by
                    })}
                    className="btn btn-secondary" 
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Download size={16} /> Download A4
                  </button>
                </div>

                {selectedOrder.customer_phone && selectedOrder.customer_phone !== '0000000000' && (
                  <button 
                    onClick={() => sendBillViaWhatsApp({
                      bill_no: selectedOrder.bill_no,
                      created_at: selectedOrder.created_at,
                      customer_name: selectedOrder.customer_name,
                      customer_phone: selectedOrder.customer_phone,
                      items: (selectedOrder.items || []).filter(item => (item as any).product_id !== 'meta_staff' && (!item.name || !item.name.startsWith('Billed by:'))),
                      subtotal: selectedOrder.subtotal || selectedOrder.total,
                      discount: selectedOrder.discount || 0,
                      gst: 0,
                      total: selectedOrder.total,
                      payment_method: selectedOrder.payment_method,
                      billed_by: selectedOrder.billed_by
                    })}
                    className="btn" 
                    style={{ background: '#25D366', color: 'white', justifyContent: 'center', borderRadius: 'var(--radius-md)', padding: '10px' }}
                  >
                    <MessageCircle size={16} /> Send via WhatsApp (+91 {selectedOrder.customer_phone})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
