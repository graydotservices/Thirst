'use client';

import { useState } from 'react';
import { Plus, Package, AlertTriangle, Edit2, Trash2, X, Check } from 'lucide-react';
import Image from 'next/image';

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  threshold: number;
  image: string;
};

const demo: Product[] = [
  { id: '1', name: 'Rose Velvet Cake', category: 'Cakes', price: 850, stock: 12, threshold: 5, image: '/cake-product.png' },
  { id: '2', name: 'Midnight Cheesecake', category: 'Cakes', price: 1200, stock: 4, threshold: 5, image: '/cake-product.png' },
  { id: '3', name: 'Berry Blast Scoop', category: 'Ice Cream', price: 320, stock: 48, threshold: 10, image: '/icecream-product.png' },
  { id: '4', name: 'Plum Royale Cone', category: 'Ice Cream', price: 280, stock: 32, threshold: 10, image: '/icecream-product.png' },
  { id: '5', name: 'Gold Parfait', category: 'Special', price: 480, stock: 3, threshold: 5, image: '/special-dessert.png' },
  { id: '6', name: 'Waffles Royale', category: 'Special', price: 540, stock: 18, threshold: 5, image: '/special-dessert.png' },
];

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(demo);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', category: 'Cakes', price: 0, stock: 0, threshold: 5 });

  const lowStock = products.filter(p => p.stock <= p.threshold);

  const handleSave = () => {
    if (editing) {
      setProducts(prev => prev.map(p => p.id === editing.id ? { ...p, ...form } : p));
    } else {
      setProducts(prev => [...prev, { ...form, id: Date.now().toString(), image: form.category === 'Cakes' ? '/cake-product.png' : form.category === 'Ice Cream' ? '/icecream-product.png' : '/special-dessert.png' }]);
    }
    setShowModal(false);
  };

  const openAdd = () => { setEditing(null); setForm({ name: '', category: 'Cakes', price: 0, stock: 0, threshold: 5 }); setShowModal(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock, threshold: p.threshold }); setShowModal(true); };
  const handleDelete = (id: string) => { if (confirm('Delete product?')) setProducts(prev => prev.filter(p => p.id !== id)); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Inventory</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{products.length} products · {lowStock.length} low stock alerts</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary"><Plus size={18} /> Add Product</button>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <AlertTriangle size={20} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>Low Stock Alert</div>
            <div style={{ color: '#78350f', fontSize: '0.875rem' }}>
              {lowStock.map(p => p.name).join(', ')} — restock needed.
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-3" style={{ gap: 'var(--space-4)' }}>
        {products.map(p => (
          <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden', border: p.stock <= p.threshold ? '2px solid rgba(245,158,11,0.5)' : undefined }}>
            <div style={{ position: 'relative', height: 160 }}>
              <Image src={p.image} alt={p.name} fill style={{ objectFit: 'cover' }} />
              {p.stock <= p.threshold && (
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <span className="badge badge-warning" style={{ background: 'rgba(245,158,11,0.9)', color: '#92400e' }}>
                    <AlertTriangle size={11} /> Low Stock
                  </span>
                </div>
              )}
            </div>
            <div style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.9375rem' }}>{p.name}</h3>
                  <span className="badge badge-primary" style={{ marginTop: '4px' }}>{p.category}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-berry)', fontSize: '1.0625rem' }}>₹{p.price}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={16} style={{ color: p.stock <= p.threshold ? 'var(--color-warning)' : 'var(--color-success)' }} />
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: p.stock <= p.threshold ? '#d97706' : '#16a34a', fontSize: '0.9rem' }}>
                    {p.stock} in stock
                  </span>
                </div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Min: {p.threshold}</span>
              </div>
              {/* Stock bar */}
              <div style={{ height: 5, background: 'var(--color-lavender)', borderRadius: 3, marginBottom: 'var(--space-3)' }}>
                <div style={{ height: '100%', borderRadius: 3, background: p.stock <= p.threshold ? '#f59e0b' : 'var(--gradient-berry)', width: `${Math.min((p.stock / (p.threshold * 4)) * 100, 100)}%`, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button onClick={() => openEdit(p)} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}><Edit2 size={13} /> Edit</button>
                <button onClick={() => handleDelete(p.id)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.25rem' }}>{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={22} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group"><label className="input-label" htmlFor="inv-name">Product Name</label><input id="inv-name" className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Product name" /></div>
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="input-group"><label className="input-label" htmlFor="inv-cat">Category</label><select id="inv-cat" className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}><option>Cakes</option><option>Ice Cream</option><option>Special</option></select></div>
                <div className="input-group"><label className="input-label" htmlFor="inv-price">Price (₹)</label><input id="inv-price" type="number" className="input" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} /></div>
                <div className="input-group"><label className="input-label" htmlFor="inv-stock">Current Stock</label><input id="inv-stock" type="number" className="input" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))} /></div>
                <div className="input-group"><label className="input-label" htmlFor="inv-thresh">Low Stock Alert At</label><input id="inv-thresh" type="number" className="input" value={form.threshold} onChange={e => setForm(p => ({ ...p, threshold: Number(e.target.value) }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}><Check size={16} /> {editing ? 'Update' : 'Add'}</button>
                <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
