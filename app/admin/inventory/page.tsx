'use client';

import { useState, useEffect } from 'react';
import { Plus, Package, AlertTriangle, Edit2, Trash2, X, Check } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  threshold: number;
  image: string;
  is_available: boolean;
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', category: 'cakes', price: 0, stock: 0, threshold: 5, image: '/cake-product.png' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data as Product[]);
    setLoading(false);
  };

  const lowStock = products.filter(p => p.stock <= p.threshold);

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalImageUrl = form.image;

      // Handle image upload if a file is selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile);
          
        if (uploadError) {
          alert(`Image upload failed: ${uploadError.message}`);
          setSaving(false);
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
          
        finalImageUrl = publicUrl;
      }

      const productData = { ...form, image: finalImageUrl };
      
      // The database schema does not have a 'threshold' column, so we must remove it before saving
      const { threshold, ...dbData } = productData;

      if (editing) {
        const { error } = await supabase
          .from('products')
          .update(dbData)
          .eq('id', editing.id);
        
        if (error) {
          alert(`Update failed: ${error.message}`);
          setSaving(false);
          return;
        }
        
        setProducts(prev => prev.map(p => p.id === editing.id ? { ...p, ...productData } : p));
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([{ ...dbData, is_available: true }])
          .select()
          .single();
          
        if (error) {
          alert(`Insert failed: ${error.message}`);
          setSaving(false);
          return;
        }
        
        if (data) {
          setProducts(prev => [data as Product, ...prev]);
        }
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
      alert('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => { 
    setEditing(null); 
    setImageFile(null);
    setForm({ name: '', category: 'cakes', price: 0, stock: 0, threshold: 5, image: '/cake-product.png' }); 
    setShowModal(true); 
  };
  
  const openEdit = (p: Product) => { 
    setEditing(p); 
    setImageFile(null);
    setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock, threshold: p.threshold || 5, image: p.image || '/cake-product.png' }); 
    setShowModal(true); 
  };
  
  const handleDelete = async (id: string) => { 
    if (confirm('Delete product permanently?')) {
      await supabase.from('products').delete().eq('id', id);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><span className="spinner"></span></div>;

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
          <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden', border: p.stock <= (p.threshold || 5) ? '2px solid rgba(245,158,11,0.5)' : undefined }}>
            <div style={{ position: 'relative', height: 160 }}>
              <Image src={p.image || '/cake-product.png'} alt={p.name} fill style={{ objectFit: 'cover' }} />
              {p.stock <= (p.threshold || 5) && (
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
                  <span className="badge badge-primary" style={{ marginTop: '4px' }}>
                    {p.category === 'cakes' ? 'Cake' : p.category === 'ice-cream' ? 'Ice Cream' : 'Special'}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-berry)', fontSize: '1.0625rem' }}>₹{p.price}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={16} style={{ color: p.stock <= (p.threshold || 5) ? 'var(--color-warning)' : 'var(--color-success)' }} />
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: p.stock <= (p.threshold || 5) ? '#d97706' : '#16a34a', fontSize: '0.9rem' }}>
                    {p.stock} in stock
                  </span>
                </div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Min: {p.threshold || 5}</span>
              </div>
              {/* Stock bar */}
              <div style={{ height: 5, background: 'var(--color-lavender)', borderRadius: 3, marginBottom: 'var(--space-3)' }}>
                <div style={{ height: '100%', borderRadius: 3, background: p.stock <= (p.threshold || 5) ? '#f59e0b' : 'var(--gradient-berry)', width: `${Math.min((p.stock / ((p.threshold || 5) * 4)) * 100, 100)}%`, transition: 'width 0.5s ease' }} />
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
              
              <div className="input-group">
                <label className="input-label" htmlFor="inv-img">Upload Image</label>
                <input 
                  id="inv-img" 
                  type="file" 
                  accept="image/*"
                  className="input" 
                  style={{ paddingTop: '8px' }}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                    }
                  }} 
                />
                {editing && form.image && !imageFile && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Current: {form.image.split('/').pop()}</p>
                )}
              </div>
              
              <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="inv-cat">Category</label>
                  <select id="inv-cat" className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="cakes">Cake</option>
                    <option value="ice-cream">Ice Cream</option>
                    <option value="special-desserts">Special Dessert</option>
                  </select>
                </div>
                <div className="input-group"><label className="input-label" htmlFor="inv-price">Price (₹)</label><input id="inv-price" type="number" className="input" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} /></div>
                <div className="input-group"><label className="input-label" htmlFor="inv-stock">Current Stock</label><input id="inv-stock" type="number" className="input" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))} /></div>
                <div className="input-group"><label className="input-label" htmlFor="inv-thresh">Low Stock Alert At</label><input id="inv-thresh" type="number" className="input" value={form.threshold} onChange={e => setForm(p => ({ ...p, threshold: Number(e.target.value) }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? 'Saving...' : <><Check size={16} /> {editing ? 'Update' : 'Add'}</>}
                </button>
                <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
