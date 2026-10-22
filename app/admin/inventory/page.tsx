'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Package, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Search, 
  Tag, 
  Settings2,
  CheckCircle2,
  Copy,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { validateImageUpload } from '@/lib/imageUpload';
import { useCategories, formatCategoryLabel, slugifyCategory } from '@/lib/categories';

const FIX_CATEGORY_SQL = `-- Run this in your Supabase SQL Editor to allow any category:
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE public.products ADD CONSTRAINT products_category_check 
  CHECK (length(btrim(category)) BETWEEN 1 AND 100);
NOTIFY pgrst, 'reload schema';`;

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  threshold?: number;
  low_stock_threshold?: number;
  image: string;
  is_available: boolean;
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ 
    name: '', 
    category: 'cakes', 
    price: 0, 
    stock: 0, 
    threshold: 5, 
    image: '/cake-product.png' 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Custom Category State inside Product Modal
  const [isAddingCustomCat, setIsAddingCustomCat] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showManageCatModal, setShowManageCatModal] = useState(false);
  const [newCatManageInput, setNewCatManageInput] = useState('');

  // Constraint error recovery state
  const [constraintModal, setConstraintModal] = useState<{
    open: boolean;
    category: string;
    pendingPayload?: Record<string, unknown>;
    isEditing?: boolean;
    editingId?: string;
  }>({ open: false, category: '' });
  const [copiedSql, setCopiedSql] = useState(false);

  // Extract all categories from products + persistent cache
  const productCategorySlugs = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  }, [products]);

  const { categories, addCategory, removeCategory } = useCategories(productCategorySlugs);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data as Product[]);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(fetchProducts);
  }, []);

  const getThreshold = (p: Product) => p.low_stock_threshold ?? p.threshold ?? 5;
  const lowStock = products.filter(p => p.stock <= getThreshold(p));

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) return;
    const added = addCategory(newCategoryName);
    setForm(p => ({ ...p, category: added.id }));
    setNewCategoryName('');
    setIsAddingCustomCat(false);
  };


  const handleFallbackSave = async (fallbackCat: string) => {
    if (!constraintModal.pendingPayload) return;
    setSaving(true);
    try {
      const payload = { ...constraintModal.pendingPayload, category: fallbackCat };
      if (constraintModal.isEditing && constraintModal.editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', constraintModal.editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert([payload]).select().single();
        if (error) throw error;
        if (data) setProducts(prev => [data as Product, ...prev]);
      }
      setConstraintModal({ open: false, category: '' });
      setShowModal(false);
      alert(`Product saved with temporary category "${fallbackCat}"! Run the SQL fix in your Supabase SQL editor whenever you're ready to use custom categories like "${constraintModal.category}".`);
      await fetchProducts();
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : '') || 'Fallback save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('Please enter a product name');
      return;
    }

    // Ensure category is not empty
    let finalCategory = form.category;
    if (isAddingCustomCat && newCategoryName.trim()) {
      const added = addCategory(newCategoryName);
      finalCategory = added.id;
    }

    setSaving(true);
    try {
      let finalImageUrl = form.image || '/cake-product.png';

      if (imageFile) {
        const fileExt = await validateImageUpload(imageFile);
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error } = await supabase.storage.from('product-images').upload(fileName, imageFile);
        if (error) throw new Error('The image could not be uploaded. Please try again.');
        const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
        finalImageUrl = data.publicUrl;
      }

      // Build payload
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        category: finalCategory,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        image: finalImageUrl,
        low_stock_threshold: Number(form.threshold) || 5,
      };

      if (editing) {
        let updateRes = await supabase
          .from('products')
          .update(payload)
          .eq('id', editing.id).select('id').single();
        
        // If column low_stock_threshold doesn't exist on remote yet, retry without it
        if (updateRes.error && updateRes.error.message.includes('low_stock_threshold')) {
          delete payload.low_stock_threshold;
          updateRes = await supabase.from('products').update(payload).eq('id', editing.id).select('id').single();
        }

        if (updateRes.error) {
          if (updateRes.error.message.includes('products_category_check')) {
            setConstraintModal({
              open: true,
              category: String(payload.category || finalCategory),
              pendingPayload: payload,
              isEditing: true,
              editingId: editing.id,
            });
            setSaving(false);
            return;
          }
          alert(`Update failed: ${updateRes.error.message}`);
          setSaving(false);
          return;
        }
        
        setProducts(prev => prev.map(p => p.id === editing.id ? { 
          ...p, 
          ...payload, 
          threshold: form.threshold,
          low_stock_threshold: form.threshold 
        } as Product : p));
      } else {
        payload.is_available = true;
        let insertRes = await supabase
          .from('products')
          .insert([payload])
          .select()
          .single();
          
        if (insertRes.error && insertRes.error.message.includes('low_stock_threshold')) {
          delete payload.low_stock_threshold;
          insertRes = await supabase.from('products').insert([payload]).select().single();
        }

        if (insertRes.error) {
          if (insertRes.error.message.includes('products_category_check')) {
            setConstraintModal({
              open: true,
              category: String(payload.category || finalCategory),
              pendingPayload: payload,
              isEditing: false,
            });
            setSaving(false);
            return;
          }
          alert(`Insert failed: ${insertRes.error.message}`);
          setSaving(false);
          return;
        }
        
        if (insertRes.data) {
          setProducts(prev => [{ 
            ...(insertRes.data as Product), 
            threshold: form.threshold, 
            low_stock_threshold: form.threshold 
          }, ...prev]);
        }
      }
      setShowModal(false);
      setIsAddingCustomCat(false);
      setNewCategoryName('');
    } catch (e: unknown) {
      console.error(e);
      alert((e instanceof Error ? e.message : '') || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => { 
    setEditing(null); 
    setImageFile(null);
    setIsAddingCustomCat(false);
    setNewCategoryName('');
    setForm({ 
      name: '', 
      category: categories[0]?.id || 'cakes', 
      price: 0, 
      stock: 0, 
      threshold: 5, 
      image: '/cake-product.png' 
    }); 
    setShowModal(true); 
  };

  const openEdit = (p: Product) => { 
    setEditing(p); 
    setImageFile(null);
    setIsAddingCustomCat(false);
    setNewCategoryName('');
    setForm({ 
      name: p.name, 
      category: p.category, 
      price: p.price, 
      stock: p.stock, 
      threshold: getThreshold(p), 
      image: p.image || '/cake-product.png' 
    }); 
    setShowModal(true); 
  };

  const handleDelete = async (id: string) => { 
    if (confirm('Delete product permanently?')) {
      const { error } = await supabase.from('products').delete().eq('id', id).select('id').single();
      if (error) {
        alert(`Delete failed: ${error.message}`);
        return;
      }
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header bar */}
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', color: 'var(--color-plum)', margin: 0 }}>
            Inventory Management
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            {products.length} products · {categories.length} categories · {lowStock.length} low stock alerts
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

          <button
            type="button"
            onClick={() => setShowManageCatModal(true)}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <Tag size={15} color="var(--color-berry)" />
            <span>Manage Categories</span>
          </button>

          <button 
            id="btn-add-product" 
            onClick={openAdd} 
            className="btn btn-primary" 
            style={{ padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <AlertTriangle size={20} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>Low Stock Alert ({lowStock.length})</div>
            <div style={{ color: '#78350f', fontSize: '0.85rem' }}>
              {lowStock.map(p => `${p.name} (${p.stock} left)`).join(', ')} — restock needed.
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 240px)', maxWidth: 380 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input 
            className="input" 
            placeholder="Search products..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{ paddingLeft: 44, background: 'white' }} 
          />
        </div>

        {/* Dynamic Category Filter Tabs */}
        <div className="admin-tab-bar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '2px', maxWidth: '100%' }}>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`btn btn-sm ${categoryFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap', padding: '7px 14px' }}
          >
            All Items ({products.length})
          </button>

          {categories.map(cat => {
            const count = products.filter(p => p.category === cat.id).length;
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap', padding: '7px 14px' }}
              >
                {cat.label} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        products.length === 0 ? (
          <div style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'inline-flex', padding: '18px', background: 'var(--color-cream)', borderRadius: '50%', marginBottom: '16px', color: 'var(--color-berry)' }}>
              <Package size={32} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--color-plum)', marginBottom: '8px', fontWeight: 700 }}>
              No Products in Inventory Yet
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Get started by adding your first product to the inventory.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={openAdd} 
                className="btn btn-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
              >
                <Plus size={18} /> Add Product
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            No products found matching &quot;{search}&quot; {categoryFilter !== 'all' ? `in category "${categoryFilter}"` : ''}.
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 'var(--space-4)' }}>
          {filteredProducts.map(p => {
            const thresh = getThreshold(p);
            const isLow = p.stock <= thresh;

            return (
              <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden', border: isLow ? '2px solid rgba(245,158,11,0.5)' : undefined }}>
                <div style={{ position: 'relative', height: 160, background: 'var(--color-lavender)' }}>
                  <Image 
                    src={p.image || '/cake-product.png'} 
                    alt={p.name} 
                    fill 
                    unoptimized 
                    style={{ objectFit: 'cover' }} 
                  />
                  {isLow && (
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                      <span className="badge badge-warning" style={{ background: 'rgba(245,158,11,0.95)', color: '#78350f', fontWeight: 700 }}>
                        <AlertTriangle size={11} /> Low Stock
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.9375rem' }}>{p.name}</h3>
                      <span className="badge badge-primary" style={{ marginTop: '4px', textTransform: 'capitalize' }}>
                        {formatCategoryLabel(p.category)}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-berry)', fontSize: '1.0625rem' }}>₹{p.price}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Package size={16} style={{ color: isLow ? 'var(--color-warning)' : 'var(--color-success)' }} />
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: isLow ? '#d97706' : '#16a34a', fontSize: '0.9rem' }}>
                        {p.stock} in stock
                      </span>
                    </div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Min: {thresh}</span>
                  </div>
                  {/* Stock bar */}
                  <div style={{ height: 5, background: 'var(--color-lavender)', borderRadius: 3, marginBottom: 'var(--space-3)' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: isLow ? '#f59e0b' : 'var(--gradient-berry)', width: `${Math.min((p.stock / Math.max(thresh * 4, 1)) * 100, 100)}%`, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button onClick={() => openEdit(p)} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}><Edit2 size={13} /> Edit</button>
                    <button onClick={() => handleDelete(p.id)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add Product Modal with Dynamic Category Support */}
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.25rem' }}>
                {editing ? 'Edit Product' : 'Add Product'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="inv-name">Product Name *</label>
                <input id="inv-name" className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Golden Tiramisu Cake" />
              </div>
              
              <div className="input-group">
                <label className="input-label" htmlFor="inv-img">Upload Image</label>
                <input 
                  id="inv-img" 
                  type="file" 
                  accept="image/png,image/jpeg,image/webp"
                  className="input" 
                  style={{ paddingTop: '8px' }}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                    }
                  }} 
                />
                {editing && form.image && !imageFile && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Current image active
                  </p>
                )}
              </div>
              
              {/* Category Field with Inline Custom Category Creation */}
              <div className="input-group" style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="input-label" htmlFor="inv-cat" style={{ margin: 0, fontWeight: 700 }}>
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomCat(!isAddingCustomCat);
                      setNewCategoryName('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-berry)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isAddingCustomCat ? '← Select Existing' : '+ Add New Category'}
                  </button>
                </div>

                {isAddingCustomCat ? (
                  <div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        autoFocus
                        className="input"
                        placeholder="Type new category (e.g. Waffles, Shakes, Mocktails)..."
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewCategory();
                          }
                        }}
                        style={{ flex: 1, background: 'white' }}
                      />
                      <button
                        type="button"
                        onClick={handleAddNewCategory}
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      >
                        <Check size={14} style={{ marginRight: 4 }} /> Add
                      </button>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      Press Add or Enter to save and apply this category immediately.
                    </span>
                  </div>
                ) : (
                  <div>
                    <select 
                      id="inv-cat" 
                      className="input" 
                      value={form.category} 
                      onChange={e => {
                        if (e.target.value === '__NEW__') {
                          setIsAddingCustomCat(true);
                        } else {
                          setForm(p => ({ ...p, category: e.target.value }));
                        }
                      }}
                      style={{ background: 'white' }}
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                      <option value="__NEW__">➕ + Add New Custom Category...</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="inv-price">Price (₹)</label>
                  <input id="inv-price" type="number" inputMode="numeric" min="0" className="input" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="inv-stock">Current Stock</label>
                  <input id="inv-stock" type="number" inputMode="numeric" min="0" className="input" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))} />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="inv-thresh">Low Stock Alert</label>
                  <input id="inv-thresh" type="number" inputMode="numeric" min="1" className="input" value={form.threshold} onChange={e => setForm(p => ({ ...p, threshold: Number(e.target.value) }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? 'Saving...' : <><Check size={16} /> {editing ? 'Update Product' : 'Add Product'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Manage Categories Modal */}
      {showManageCatModal && (
        <div className="overlay" onClick={() => setShowManageCatModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={20} color="var(--color-berry)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.25rem', margin: 0 }}>
                  Manage Product Categories
                </h3>
              </div>
              <button onClick={() => setShowManageCatModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={22} />
              </button>
            </div>

            {/* Quick Add Form */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                className="input"
                placeholder="New category name (e.g. Milkshakes, Pastries)..."
                value={newCatManageInput}
                onChange={e => setNewCatManageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newCatManageInput.trim()) {
                      addCategory(newCatManageInput);
                      setNewCatManageInput('');
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newCatManageInput.trim()) {
                    addCategory(newCatManageInput);
                    setNewCatManageInput('');
                  }
                }}
                className="btn btn-primary"
                style={{ padding: '8px 18px', whiteSpace: 'nowrap' }}
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {/* Existing Categories List */}
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(c => {
                const count = products.filter(p => p.category === c.id).length;
                return (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--color-plum)', fontSize: '0.9rem' }}>{c.label}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '8px' }}>
                        ({count} product{count === 1 ? '' : 's'})
                      </span>
                    </div>

                    {count === 0 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(c.id)}
                        title="Delete unused category"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowManageCatModal(false)}
                className="btn btn-primary"
                style={{ padding: '8px 20px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Constraint Fix Modal */}
      {constraintModal.open && (
        <div className="overlay" style={{ zIndex: 1200 }} onClick={() => setConstraintModal({ open: false, category: '' })}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.25rem', margin: 0 }}>
                    Database Category Constraint
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>PostgreSQL check violation</span>
                </div>
              </div>
              <button onClick={() => setConstraintModal({ open: false, category: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px', marginBottom: '16px', fontSize: '0.9rem', color: '#92400e', lineHeight: 1.5 }}>
              Your Supabase database table <strong>&quot;products&quot;</strong> currently has an older check constraint restricting categories to only:
              <br />
              <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, display: 'inline-block', marginTop: '6px' }}>cakes</code>, <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>ice-cream</code>, <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>special-desserts</code>.
              <br />
              PostgreSQL rejected category: <strong>&quot;{constraintModal.category}&quot;</strong>.
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)' }}>
                  1. Run this 2-line SQL in Supabase SQL Editor (10 seconds):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(FIX_CATEGORY_SQL);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 3000);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-berry)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Copy size={13} />
                  <span>{copiedSql ? '✓ Copied!' : 'Copy SQL'}</span>
                </button>
              </div>

              <pre style={{ background: '#1e1e2e', color: '#cdd6f4', padding: '14px', borderRadius: '8px', fontSize: '0.8rem', lineHeight: 1.45, overflowX: 'auto', fontFamily: 'monospace', margin: 0 }}>
                {FIX_CATEGORY_SQL}
              </pre>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <a
                href="https://supabase.com/dashboard/project/ecmwqikinlmmrsgjdbbd/sql"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 18px', fontSize: '0.9rem' }}
              >
                <ExternalLink size={16} /> Open Supabase SQL Editor
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(FIX_CATEGORY_SQL);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 3000);
                }}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '11px 18px', fontSize: '0.9rem' }}
              >
                <Copy size={16} /> {copiedSql ? 'Copied!' : 'Copy Script'}
              </button>
            </div>

            {constraintModal.pendingPayload && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                  Need to save immediately before opening Supabase?
                </span>
                <button
                  type="button"
                  onClick={() => handleFallbackSave('special-desserts')}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', color: 'var(--color-plum)', background: '#f8fafc' }}
                >
                  Save as &quot;special-desserts&quot; temporarily so work is not lost
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
