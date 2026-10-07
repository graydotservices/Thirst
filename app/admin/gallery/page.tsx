'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Upload, Trash2, Eye, X, Loader2, Plus, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type GalleryItem = { 
  id: string; 
  image_url: string; 
  caption: string; 
  is_active: boolean; 
};

const defaultDemo: GalleryItem[] = [
  { id: '1', image_url: '/cake-product.png', caption: 'Rose Velvet Cake', is_active: true },
  { id: '2', image_url: '/icecream-product.png', caption: 'Berry Artisan Ice Cream', is_active: true },
  { id: '3', image_url: '/special-dessert.png', caption: 'Gold Parfait', is_active: true },
  { id: '4', image_url: '/hero-bg.png', caption: 'Premium Dessert Collection', is_active: false },
];

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<GalleryItem | null>(null);
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setItems(defaultDemo);
      } else {
        const mapped = data.map((g: any) => ({
          id: g.id,
          image_url: g.image_url || '/cake-product.png',
          caption: g.caption || 'Thirst Special Dessert',
          is_active: g.is_active ?? true,
        }));
        setItems(mapped);
      }
    } catch {
      setItems(defaultDemo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
      setCaption(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      setShowUploadModal(true);
      setUploadError('');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !filePreviewUrl) {
      setUploadError('Please select an image to upload.');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      let finalUrl = '/cake-product.png';

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `gallery-${Date.now()}.${fileExt}`;
        
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(fileName, selectedFile, { upsert: true });

        if (uploadErr) {
          console.warn('Bucket upload error, falling back to local object:', uploadErr.message);
          finalUrl = filePreviewUrl;
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);
          if (publicUrl) finalUrl = publicUrl;
        }
      }

      const { data, error } = await supabase
        .from('gallery')
        .insert([{
          image_url: finalUrl,
          caption: caption.trim() || 'Thirst Special',
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.warn('Database insert warning, saving locally:', error.message);
        const localItem: GalleryItem = {
          id: Date.now().toString(),
          image_url: finalUrl,
          caption: caption.trim() || 'Thirst Special',
          is_active: true
        };
        setItems(prev => [localItem, ...prev]);
      } else if (data) {
        setItems(prev => [{
          id: data.id,
          image_url: data.image_url,
          caption: data.caption || '',
          is_active: data.is_active ?? true
        }, ...prev]);
      }

      setShowUploadModal(false);
      setSelectedFile(null);
      setFilePreviewUrl('');
      setCaption('');
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const toggleVisibility = async (item: GalleryItem) => {
    const next = !item.is_active;
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, is_active: next } : x));
    try {
      await supabase.from('gallery').update({ is_active: next }).eq('id', item.id);
    } catch (e) {
      console.warn('Failed to update visibility in Supabase', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this gallery photo?')) {
      setItems(prev => prev.filter(x => x.id !== id));
      try {
        await supabase.from('gallery').delete().eq('id', id);
      } catch (e) {
        console.warn('Failed to delete item from Supabase', e);
      }
    }
  };

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', color: 'var(--color-plum)' }}>Gallery Manager</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{items.filter(i => i.is_active).length} active images on showcase</p>
        </div>
        <button 
          id="btn-upload-gallery"
          onClick={() => fileInputRef.current?.click()} 
          className="btn btn-primary"
          style={{ padding: '10px 18px' }}
        >
          <Upload size={18} /> Upload Image
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      {/* Upload drop zone */}
      <div 
        onClick={() => fileInputRef.current?.click()} 
        style={{ border: '2px dashed var(--color-soft-pink)', borderRadius: 'var(--radius-xl)', padding: 'clamp(20px, 4vw, 32px)', textAlign: 'center', marginBottom: 'var(--space-5)', background: 'rgba(246,183,210,0.06)', cursor: 'pointer', transition: 'background 0.2s ease' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(246,183,210,0.12)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(246,183,210,0.06)'}
      >
        <Upload size={28} style={{ color: 'var(--color-berry)', margin: '0 auto 8px' }} />
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '4px', fontSize: '0.95rem' }}>Click or drop dessert photos here</p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Supports PNG, JPG, WebP up to 5MB</p>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh', color: 'var(--color-text-muted)' }}>
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
          No images in gallery yet. Click upload to showcase your desserts!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--space-3)' }}>
          {items.map(item => (
            <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden', opacity: item.is_active ? 1 : 0.65 }}>
              <div style={{ position: 'relative', paddingBottom: '100%', background: 'var(--color-lavender)' }}>
                <Image 
                  src={item.image_url} 
                  alt={item.caption} 
                  fill 
                  unoptimized 
                  style={{ objectFit: 'cover' }} 
                />
                {!item.is_active && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="badge" style={{ background: 'rgba(0,0,0,0.75)', color: 'white', fontWeight: 600 }}>Hidden</span>
                  </div>
                )}
              </div>
              <div style={{ padding: 'var(--space-3)' }}>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-plum)', fontSize: '0.875rem', marginBottom: 'var(--space-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.caption}>
                  {item.caption}
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setPreview(item)} title="Preview full size" style={{ flex: 1, padding: '7px', background: 'var(--color-lavender)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-plum)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={14} />
                  </button>
                  <button onClick={() => toggleVisibility(item)} style={{ flex: 1, padding: '7px', background: item.is_active ? 'rgba(34,197,94,0.1)' : 'var(--color-lavender)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: item.is_active ? 'var(--color-success)' : 'var(--color-text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    {item.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => handleDelete(item.id)} title="Delete image" style={{ padding: '7px 10px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Confirmation Modal */}
      {showUploadModal && (
        <div className="overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '1.25rem' }}>
                Add to Showcase
              </h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {uploadError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>
                <AlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}

            {filePreviewUrl && (
              <div style={{ position: 'relative', width: '100%', height: 200, borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-4)', background: 'var(--color-lavender)' }}>
                <Image src={filePreviewUrl} alt="Preview" fill unoptimized style={{ objectFit: 'cover' }} />
              </div>
            )}

            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Photo Caption
                </label>
                <input 
                  type="text" 
                  required
                  className="input" 
                  value={caption} 
                  onChange={e => setCaption(e.target.value)} 
                  placeholder="e.g. Signature Belgium Truffle Tart" 
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Publishing...' : <><Check size={16} /> Publish Image</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Preview */}
      {preview && (
        <div className="lightbox-overlay" onClick={() => setPreview(null)}>
          <button onClick={() => setPreview(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: 12, borderRadius: '50%', cursor: 'pointer' }}>
            <X size={24} />
          </button>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 640, width: '90%', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: '#1c151b' }}>
            <div style={{ position: 'relative', width: '100%', height: 420 }}>
              <Image src={preview.image_url} alt={preview.caption} fill unoptimized style={{ objectFit: 'contain' }} />
            </div>
            <div style={{ background: 'rgba(0,0,0,0.85)', padding: 'var(--space-4)', textAlign: 'center' }}>
              <p style={{ color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{preview.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

