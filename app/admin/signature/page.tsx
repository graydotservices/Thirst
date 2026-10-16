'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, 
  Save, 
  RotateCcw, 
  ExternalLink, 
  Upload, 
  Check, 
  Star, 
  Award, 
  AlertCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { 
  useSignatureSettings, 
  SignatureSettings, 
  DEFAULT_SIGNATURE_SETTINGS 
} from '@/lib/signatureSettings';
import { supabase } from '@/lib/supabase';
import { validateImageUpload } from '@/lib/imageUpload';

const PRESET_IMAGES = [
  { label: 'Signature Sip (Sketch)', url: '/vintage-hot-chocolate.png' },
  { label: 'Vintage Waffle', url: '/vintage-waffle.png' },
  { label: 'Lotus Biscoff Waffle', url: '/biscoff-waffle.png' },
  { label: 'Thirst Dream Cake', url: '/dream-cake.png' },
  { label: 'The Signature Shake', url: '/thick-shake.png' },
  { label: 'Blue Crusher', url: '/blue-crusher.png' },
  { label: 'Hot Chocolate', url: '/hot-chocolate.png' },
];

export default function AdminSignaturePage() {
  const { settings, loading, updateSettings } = useSignatureSettings();
  const [form, setForm] = useState<SignatureSettings>(DEFAULT_SIGNATURE_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && settings) {
      setForm(settings);
    }
  }, [loading, settings]);

  const handleChange = (field: keyof SignatureSettings, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
    setErrorMessage('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMessage('');
    try {
      const fileExt = await validateImageUpload(file);
      const fileName = `signature-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message || 'Image upload failed. You can use preset images or enter an image URL.');
      }

      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      if (data?.publicUrl) {
        handleChange('image_url', data.publicUrl);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (confirm('Reset signature details to default "The Signature Sip"? Any unsaved changes will be lost.')) {
      setForm(DEFAULT_SIGNATURE_SETTINGS);
      setSaveSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setErrorMessage('Please provide a title for the signature item.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      const res = await updateSettings(form);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage(res.error || 'Failed to save signature changes.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '10px', 
              background: 'rgba(217, 79, 138, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'var(--color-berry)' 
            }}>
              <Sparkles size={20} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-plum)', margin: 0 }}>
              The Signature Section
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: form.is_active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: form.is_active ? '#15803d' : '#b91c1c'
            }}>
              {form.is_active ? <CheckCircle2 size={12} /> : <EyeOff size={12} />}
              {form.is_active ? 'Live on Main URL' : 'Hidden from Main URL'}
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Modify all texts, price, badges, action button, and image for the featured spotlight on the main homepage.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-lavender)',
              color: 'var(--color-plum)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            <ExternalLink size={16} />
            <span>View Main URL</span>
          </Link>

          <button
            type="button"
            onClick={handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14 }} />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check size={16} />
                <span>Saved Live!</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 18px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          color: '#991b1b',
          fontSize: '0.875rem',
          marginBottom: '20px'
        }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 18px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 'var(--radius-md)',
          color: '#166534',
          fontSize: '0.875rem',
          marginBottom: '20px'
        }}>
          <CheckCircle2 size={18} />
          <span>The Signature section has been successfully updated and is live on the main URL!</span>
        </div>
      )}

      {/* Grid: Editor Form (Left) & Real-time Live Preview (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))',
        gap: '28px',
        alignItems: 'start'
      }}>
        {/* Left: Configuration Form */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '20px' }}>
            Edit Signature Content
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Status toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'var(--color-cream)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-lavender-dark)'
            }}>
              <div>
                <label style={{ fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  {form.is_active ? <Eye size={16} color="var(--color-berry)" /> : <EyeOff size={16} color="#94a3b8" />}
                  Show on Homepage
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Display or hide the entire "Today's Signature Dessert" block from the main website.
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => handleChange('is_active', e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--color-berry)', cursor: 'pointer' }}
              />
            </div>

            {/* Eyebrow / Badge */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                Eyebrow / Subtitle Badge
              </label>
              <input
                type="text"
                value={form.badge}
                onChange={e => handleChange('badge', e.target.value)}
                placeholder="e.g. THIRST SPECIAL"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                Small uppercase badge shown directly above the title.
              </span>
            </div>

            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                Item Name / Title <span style={{ color: 'var(--color-berry)' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="e.g. The Signature Sip"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Describe ingredients, taste profile, and handcrafted luxury..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Two column: Price & Button Text */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Price Display
                </label>
                <input
                  type="text"
                  value={form.price}
                  onChange={e => handleChange('price', e.target.value)}
                  placeholder="e.g. ₹99"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    fontWeight: 700
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Button Text
                </label>
                <input
                  type="text"
                  value={form.button_text}
                  onChange={e => handleChange('button_text', e.target.value)}
                  placeholder="e.g. View Menu"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            {/* Two column: Rating & Tag */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Rating Text
                </label>
                <input
                  type="text"
                  value={form.rating_text}
                  onChange={e => handleChange('rating_text', e.target.value)}
                  placeholder="e.g. 5.0 (250+ reviews)"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                  Badge Tag
                </label>
                <input
                  type="text"
                  value={form.tag_text}
                  onChange={e => handleChange('tag_text', e.target.value)}
                  placeholder="e.g. Best Seller"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            {/* Button Link */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '6px' }}>
                Button Destination Link
              </label>
              <input
                type="text"
                value={form.button_link}
                onChange={e => handleChange('button_link', e.target.value)}
                placeholder="e.g. /menu or /menu/special-desserts"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Image Selection & Upload */}
            <div style={{
              background: '#f8fafc',
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #e2e8f0'
            }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '8px' }}>
                Featured Image
              </label>

              {/* Upload trigger */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--color-plum)',
                    cursor: uploadingImage ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Upload size={14} color="var(--color-berry)" />
                  <span>{uploadingImage ? 'Uploading Image...' : 'Upload Image (PNG/JPG/WebP)'}</span>
                </button>

                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>or select a preset below</span>
              </div>

              {/* Preset buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                {PRESET_IMAGES.map((preset) => {
                  const selected = form.image_url === preset.url;
                  return (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => handleChange('image_url', preset.url)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: selected ? 'var(--color-berry)' : 'white',
                        color: selected ? 'white' : '#334155',
                        border: selected ? '1px solid var(--color-berry)' : '1px solid #e2e8f0',
                        fontSize: '0.78rem',
                        fontWeight: selected ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <ImageIcon size={13} />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Image URL Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                  Image Path / Public URL:
                </label>
                <input
                  type="text"
                  value={form.image_url}
                  onChange={e => handleChange('image_url', e.target.value)}
                  placeholder="/vintage-hot-chocolate.png or https://..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                    background: 'white'
                  }}
                />
              </div>
            </div>

            {/* Bottom Save Button */}
            <div style={{ marginTop: '10px' }}>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                    <span>Saving Changes...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check size={18} />
                    <span>Saved! Changes Are Live</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save & Update Homepage</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Interactive Real-Time Preview */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} color="var(--color-berry)" />
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.95rem' }}>
                  Live Homepage Preview
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Updates in real-time</span>
            </div>

            {/* Homepage Card Mockup */}
            <div style={{
              background: 'var(--gradient-hero)',
              borderRadius: '24px',
              padding: '36px 24px',
              border: '2px dashed var(--color-lavender-dark)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {!form.is_active && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(3px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                  padding: '20px'
                }}>
                  <EyeOff size={36} color="#94a3b8" style={{ marginBottom: 10 }} />
                  <div style={{ fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.1rem' }}>Section is Currently Hidden</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>
                    Enable &quot;Show on Homepage&quot; to make this section visible to visitors.
                  </div>
                </div>
              )}

              {/* Image with sketch border */}
              <div style={{ maxWidth: '220px', margin: '0 auto 24px auto', position: 'relative' }}>
                <div style={{
                  position: 'relative',
                  paddingBottom: '100%',
                  borderRadius: '28px',
                  overflow: 'hidden',
                  border: '4px solid var(--color-plum)',
                  boxShadow: 'var(--shadow-lg)',
                  background: 'white'
                }}>
                  <Image
                    src={form.image_url || '/vintage-hot-chocolate.png'}
                    alt={form.title || 'Signature Item'}
                    fill
                    unoptimized={form.image_url?.startsWith('http')}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </div>

              {/* Eyebrow badge */}
              {form.badge && (
                <div style={{
                  color: 'var(--color-berry)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginBottom: '10px'
                }}>
                  {form.badge}
                </div>
              )}

              {/* Title */}
              <h3 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                color: 'var(--color-plum)',
                lineHeight: 1.15,
                marginBottom: '14px',
                fontWeight: 800
              }}>
                {form.title || 'The Signature Sip'}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                marginBottom: '20px',
                fontWeight: 600,
                padding: '0 10px'
              }}>
                {form.description || 'Handcrafted dessert experience handcrafted for chocolate lovers.'}
              </p>

              {/* Badges / Ratings */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {form.rating_text && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                    <Star fill="var(--color-gold)" color="var(--color-gold)" size={16} />
                    <span style={{ fontWeight: 800, color: 'var(--color-plum)' }}>{form.rating_text}</span>
                  </div>
                )}
                {form.tag_text && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-plum)', fontWeight: 800, fontSize: '0.85rem' }}>
                    <Award color="var(--color-berry)" size={16} />
                    <span>{form.tag_text}</span>
                  </div>
                )}
              </div>

              {/* Price & Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {form.price && (
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: 'var(--color-plum)'
                  }}>
                    {form.price}
                  </div>
                )}
                <div
                  className="btn btn-primary"
                  style={{
                    padding: '10px 22px',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none'
                  }}
                >
                  {form.button_text || 'View Menu'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
