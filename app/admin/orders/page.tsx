'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Receipt, Calendar, CreditCard, ChevronRight, X, Download, Trash2, MessageCircle } from 'lucide-react';
import { generateInvoicePDF } from '@/lib/pdfUtils';

type Order = {
  id: string;
  bill_no: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  items: Array<{ name: string; qty: number; price: number; total: number }>;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
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

  const deleteOrder = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      await supabase.from('orders').delete().eq('id', id);
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  const handleWhatsApp = (order: Order) => {
    if (!order.customer_phone || order.customer_phone === '0000000000') {
      alert('No valid phone number found for this customer.');
      return;
    }
    const msg = encodeURIComponent(
      `Hi ${order.customer_name || 'Valued Customer'},\n\nThank you for visiting *Thirst.*!\n\nInvoice No: ${order.bill_no}\nDate: ${new Date(order.created_at).toLocaleDateString('en-IN')}\nAmount: ₹${order.total}\n\nYour invoice is ready. Hope to see you again! ❤\n\n— Thirst. Team`
    );
    window.open(`https://wa.me/${order.customer_phone}?text=${msg}`, '_blank');
  };

  const filtered = orders.filter(o => 
    o.bill_no.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    (o.customer_phone && o.customer_phone.includes(search))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Order History</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{orders.length} total orders processed</p>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 'var(--space-6)', maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input 
          className="input" 
          placeholder="Search by bill number, name or phone..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 44, background: 'white' }}
        />
      </div>

      <div className="table-container">
        <table>
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
              const staffMeta = order.items?.find(item => (item as any).product_id === 'meta_staff' || item.name.startsWith('Billed by:'));
              return (
              <tr key={order.id} style={{ borderBottom: '1px solid var(--color-lavender)' }}>
                <td>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-plum)' }}>{order.bill_no}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {new Date(order.created_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                  {staffMeta && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-berry)', marginTop: '4px', fontWeight: 600 }}>
                      {staffMeta.name}
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{order.customer_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{order.customer_phone || '-'}</div>
                </td>
                <td style={{ fontSize: '0.875rem' }}>
                  {(order.items?.length || 0) - (staffMeta ? 1 : 0)} items
                </td>
                <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-berry)' }}>
                  ₹{order.total.toLocaleString('en-IN')}
                </td>
                <td>
                  <span className="badge" style={{ 
                    background: 'rgba(217,79,138,0.1)', 
                    color: 'var(--color-berry)', 
                    textTransform: 'uppercase', 
                    fontSize: '0.7rem' 
                  }}>
                    {order.payment_method}
                  </span>
                </td>
                <td>
                  <span className="badge badge-success">
                    {order.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="btn btn-secondary btn-sm" 
                      style={{ padding: '6px 12px' }}
                    >
                      View <ChevronRight size={14} />
                    </button>
                    <button 
                      onClick={() => deleteOrder(order.id)}
                      className="btn btn-sm" 
                      style={{ padding: '6px 10px', background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.2)' }}
                      title="Delete Order"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-4)', borderBottom: '1px dashed var(--color-lavender-dark)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.25rem' }}>Bill #{selectedOrder.bill_no}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  {new Date(selectedOrder.created_at).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={22} /></button>
            </div>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '4px' }}>Customer Info</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
                <span style={{ fontWeight: 600 }}>Name:</span> {selectedOrder.customer_name}<br/>
                <span style={{ fontWeight: 600 }}>Phone:</span> {selectedOrder.customer_phone || 'N/A'}
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', marginBottom: 'var(--space-3)' }}>Items Purchased</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {selectedOrder.items?.filter(item => (item as any).product_id !== 'meta_staff' && !item.name.startsWith('Billed by:')).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--color-lavender)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-plum)', fontSize: '0.9375rem' }}>{item.name}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{item.qty} x ₹{item.price}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--color-berry)' }}>
                      ₹{item.total}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--color-cream)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--color-lavender-dark)' }}>
                <span>Discount</span>
                <span style={{ color: 'var(--color-error)' }}>-₹{selectedOrder.discount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.25rem' }}>
                <span>Total</span>
                <span>₹{selectedOrder.total}</span>
              </div>
            </div>
            
            <div style={{ marginTop: 'var(--space-4)', textAlign: 'center', display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
               {selectedOrder.items?.find(item => (item as any).product_id === 'meta_staff' || item.name.startsWith('Billed by:')) && (
                 <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>
                   {selectedOrder.items?.find(item => (item as any).product_id === 'meta_staff' || item.name.startsWith('Billed by:'))?.name}
                 </div>
               )}
               <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                 <span className="badge" style={{ background: 'rgba(217,79,138,0.1)', color: 'var(--color-berry)', textTransform: 'uppercase', padding: '8px 16px', fontSize: '0.875rem' }}>
                    Paid via {selectedOrder.payment_method}
                 </span>
                 <button 
                   onClick={() => generateInvoicePDF(selectedOrder)}
                   className="btn btn-secondary btn-sm"
                   style={{ padding: '8px 16px' }}
                 >
                   <Download size={16} /> Download Bill
                 </button>
                 <button 
                   onClick={() => handleWhatsApp(selectedOrder)}
                   className="btn btn-sm"
                   style={{ padding: '8px 16px', background: '#25D366', color: 'white', borderColor: '#25D366' }}
                 >
                   <MessageCircle size={16} /> WhatsApp
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
