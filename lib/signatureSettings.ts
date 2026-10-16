import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export type SignatureSettings = {
  id?: string;
  is_active: boolean;
  badge: string;
  title: string;
  description: string;
  rating_text: string;
  tag_text: string;
  price: string;
  button_text: string;
  button_link: string;
  image_url: string;
  updated_at?: string;
};

export const DEFAULT_SIGNATURE_SETTINGS: SignatureSettings = {
  id: 'primary',
  is_active: true,
  badge: 'Thirst Special',
  title: 'The Signature Sip',
  description:
    'Hot chocolate with Milo, marshmallows, biscuit crunch, and a chocolate roll. A truly decadent experience handcrafted for chocolate lovers.',
  rating_text: '5.0 (250+ reviews)',
  tag_text: 'Best Seller',
  price: '₹99',
  button_text: 'View Menu',
  button_link: '/menu',
  image_url: '/vintage-hot-chocolate.png',
};

const STORAGE_KEY = 'thirst_signature_settings_cache';
const UPDATE_EVENT_KEY = 'thirst_signature_settings_updated';

/**
 * Synchronously retrieve cached signature settings from localStorage or fallback
 */
export function getCachedSignatureSettings(): SignatureSettings {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SIGNATURE_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // fallback to default
    }
  }
  return DEFAULT_SIGNATURE_SETTINGS;
}

/**
 * Fetch signature settings from Supabase, synchronizing with localStorage cache
 */
export async function fetchSignatureSettings(): Promise<SignatureSettings> {
  const fallback = getCachedSignatureSettings();
  try {
    const { data, error } = await supabase
      .from('signature_settings')
      .select('*')
      .eq('id', 'primary')
      .maybeSingle();

    if (error || !data) {
      return fallback;
    }

    const merged: SignatureSettings = {
      ...DEFAULT_SIGNATURE_SETTINGS,
      ...data,
      is_active: data.is_active ?? true,
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {}
    }
    return merged;
  } catch {
    return fallback;
  }
}

/**
 * Check if the signature_settings table exists and is accessible in Supabase
 */
export async function checkSignatureTableHealth(): Promise<{ exists: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('signature_settings')
      .select('id')
      .limit(1);

    if (error) {
      const isMissing = 
        error.code === 'PGRST205' || 
        error.code === '42P01' || 
        error.message?.toLowerCase().includes('does not exist') || 
        error.message?.toLowerCase().includes('schema cache');

      if (isMissing) {
        return { 
          exists: false, 
          error: 'Database table "signature_settings" does not exist in your Supabase project yet.' 
        };
      }
      return { exists: false, error: error.message };
    }
    return { exists: true };
  } catch (err: unknown) {
    return { exists: false, error: err instanceof Error ? err.message : 'Database check failed' };
  }
}

/**
 * Save updated signature settings to Supabase and browser cache
 */
export async function saveSignatureSettings(
  updates: Partial<SignatureSettings>
): Promise<{ success: boolean; data?: SignatureSettings; error?: string; isTableMissing?: boolean }> {
  try {
    const current = getCachedSignatureSettings();
    const payload: SignatureSettings = {
      ...current,
      ...updates,
      id: 'primary',
      updated_at: new Date().toISOString(),
    };

    // Attempt remote save to Supabase
    const { data, error } = await supabase
      .from('signature_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Failed to save signature settings to Supabase:', error);
      const isMissing = 
        error.code === 'PGRST205' || 
        error.code === '42P01' || 
        error.message?.toLowerCase().includes('does not exist') || 
        error.message?.toLowerCase().includes('schema cache');

      const friendlyMsg = isMissing
        ? 'Database table "signature_settings" does not exist in your Supabase project yet. Please run the SQL migration script in your Supabase SQL Editor.'
        : `Database error (${error.code || 'error'}): ${error.message}`;

      // Cache locally on this device so input is not lost, but return success: false so the user is not misled
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {}
      }

      return {
        success: false,
        error: friendlyMsg,
        isTableMissing: isMissing,
        data: payload
      };
    }

    const finalData = data ? { ...payload, ...data } : payload;

    // Persist locally & dispatch update event for instant reactive rendering
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT_KEY, { detail: finalData }));
      } catch {}
    }

    return { success: true, data: finalData };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err instanceof Error ? err.message : '') || 'Failed to save signature settings',
    };
  }
}

/**
 * React hook for dynamic signature item data across the entire application
 */
export function useSignatureSettings() {
  const [settings, setSettings] = useState<SignatureSettings>(DEFAULT_SIGNATURE_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const fresh = await fetchSignatureSettings();
    setSettings(fresh);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial load from cache then remote
    const cached = getCachedSignatureSettings();
    setSettings(cached);
    void Promise.resolve().then(reload);

    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setSettings(prev => ({ ...prev, ...detail }));
      } else {
        reload();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(UPDATE_EVENT_KEY, handleUpdate);
      return () => {
        window.removeEventListener(UPDATE_EVENT_KEY, handleUpdate);
      };
    }
  }, [reload]);

  return {
    settings,
    loading,
    reload,
    updateSettings: saveSignatureSettings,
  };
}
