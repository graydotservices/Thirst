'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, Trash2, Eye, X } from 'lucide-react';

type GalleryItem = { id: string; image_url: string; caption: string; is_active: boolean; };
const demo: GalleryItem[] = [
  { id: '1', image_url: '/cake-product.png', caption: 'Rose Velvet Cake', is_active: true },
  { id: '2', image_url: '/icecream-product.png', caption: 'Berry Artisan Ice Cream', is_active: true },
  { id: '3', image_url: '/special-dessert.png', caption: 'Gold Parfait', is_active: true },
  { id: '4', image_url: '/hero-bg.png', caption: 'Premium Dessert Collection', is_active: false },
];

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>(demo);
  const [preview, setPreview] = useState<GalleryItem | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div><h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-plum)' }}>Gallery Manager</h1><p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{items.filter(i => i.is_active).length} active images</p></div>
        <button className="btn btn-primary"><Upload size={18} /> Upload Image</button>
      </div>

      {/* Upload drop zone */}
      <div style={{ border: '2px dashed var(--color-soft-pink)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-10)', textAlign: 'center', marginBottom: 'var(--space-6)', background: 'rgba(246,183,210,0.06)', cursor: 'pointer' }}>
        <Upload size={32} style={{ color: 'var(--color-soft-pink)', margin: '0 auto var(--space-3)' }} />
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '6px' }}>Drag & drop images here</p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Or click to browse. PNG, JPG up to 5MB</p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginTop: 'var(--space-3)' }}>💡 Connect Supabase storage to enable real uploads.</p>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-4">
        {items.map(item => (
          <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden', opacity: item.is_active ? 1 : 0.6 }}>
            <div style={{ position: 'relative', paddingBottom: '100%' }}>
              <Image src={item.image_url} alt={item.caption} fill style={{ objectFit: 'cover' }} />
              {!item.is_active && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="badge" style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}>Hidden</span>
                </div>
              )}
            </div>
            <div style={{ padding: 'var(--space-3)' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-plum)', fontSize: '0.875rem', marginBottom: 'var(--space-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.caption}
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setPreview(item)} style={{ flex: 1, padding: '7px', background: 'var(--color-lavender)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-plum)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={14} /></button>
                <button onClick={() => setItems(prev => prev.map(x => x.id === item.id ? { ...x, is_active: !x.is_active } : x))} style={{ flex: 1, padding: '7px', background: item.is_active ? 'rgba(34,197,94,0.1)' : 'var(--color-lavender)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: item.is_active ? 'var(--color-success)' : 'var(--color-text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                  {item.is_active ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => setItems(prev => prev.filter(x => x.id !== item.id))} style={{ padding: '7px 10px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="lightbox-overlay" onClick={() => setPreview(null)}>
          <button onClick={() => setPreview(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: 12, borderRadius: '50%', cursor: 'pointer' }}>
            <X size={24} />
          </button>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 600, width: '90%', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            <Image src={preview.image_url} alt={preview.caption} width={600} height={500} style={{ width: '100%', height: 'auto', display: 'block' }} />
            <div style={{ background: 'rgba(0,0,0,0.7)', padding: 'var(--space-4)', textAlign: 'center' }}>
              <p style={{ color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{preview.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
