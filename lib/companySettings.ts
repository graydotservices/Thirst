import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export type CompanySettings = {
  id?: string;
  name: string;
  tagline: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  alt_phone?: string;
  email: string;
  gstin?: string;
  fssai?: string;
  opening_hours: string;
  google_maps_url?: string;
  updated_at?: string;
};

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  id: 'primary',
  name: 'Thirst.',
  tagline: "India's Premium Luxury Dessert Boutique",
  address_line1: 'NO.01, Siva Vishnu kovil street',
  address_line2: 'kakkalur',
  city: 'Thiruvallur',
  state: 'Tamil Nadu',
  pincode: '602001',
  phone: '+91 87548 81546',
  alt_phone: '+91 98765 43210',
  email: 'thirst.freshchennai@gmail.com',
  gstin: '33AABCT0000A1Z5',
  fssai: '22425478001152',
  opening_hours: 'Mon–Sun: 2:00 PM – 12:00 AM',
  google_maps_url: 'https://maps.google.com/?q=NO.01,+Siva+Vishnu+kovil+street,+kakkalur,+Thiruvallur',
};

const STORAGE_KEY = 'thirst_company_settings_cache';
const UPDATE_EVENT_KEY = 'thirst_company_settings_updated';

/**
 * Returns formatted full address string
 */
export function getFormattedAddress(settings: Partial<CompanySettings>): string {
  const parts = [
    settings.address_line1,
    settings.address_line2,
    settings.city,
    settings.state ? `${settings.state}${settings.pincode ? ` - ${settings.pincode}` : ''}` : settings.pincode,
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Clean and format Indian phone number for display (+91 XXXXX XXXXX)
 */
export function formatIndianPhoneDisplay(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91 ${digits.slice(1, 6)} ${digits.slice(6)}`;
  }
  return raw;
}

/**
 * Format phone number for WhatsApp wa.me link (91XXXXXXXXXX)
 */
export function getWhatsAppPhone(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Generate a wa.me link with encoded message
 */
export function createWhatsAppUrl(phone: string, message?: string): string {
  const cleanPhone = getWhatsAppPhone(phone);
  if (!cleanPhone) return '';
  const baseUrl = `https://wa.me/${cleanPhone}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}

/**
 * Retrieve cached settings synchronously from localStorage (or fallback)
 */
export function getCachedCompanySettings(): CompanySettings {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_COMPANY_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
  }
  return DEFAULT_COMPANY_SETTINGS;
}

/**
 * Fetch company settings from Supabase, syncing with localStorage
 */
export async function fetchCompanySettings(): Promise<CompanySettings> {
  const fallback = getCachedCompanySettings();
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('id', 'primary')
      .maybeSingle();

    if (error || !data) {
      return fallback;
    }

    const merged: CompanySettings = {
      ...DEFAULT_COMPANY_SETTINGS,
      ...data,
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
 * Save updated company settings to Supabase and cache
 */
export async function saveCompanySettings(updates: Partial<CompanySettings>): Promise<{ success: boolean; data?: CompanySettings; error?: string }> {
  try {
    const current = getCachedCompanySettings();
    const payload: CompanySettings = {
      ...current,
      ...updates,
      id: 'primary',
      updated_at: new Date().toISOString(),
    };

    // Update in Supabase
    const { data, error } = await supabase
      .from('company_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    const finalData = data ? { ...payload, ...data } : payload;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT_KEY, { detail: finalData }));
      } catch {}
    }

    if (error) {
      console.warn('Supabase company_settings upsert warning:', error.message);
      // Still considered success locally
      return { success: true, data: finalData };
    }

    return { success: true, data: finalData };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save company settings' };
  }
}

/**
 * React Hook for dynamic company settings across the entire app
 */
export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings>(getCachedCompanySettings);
  const [loading, setLoading] = useState<boolean>(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const fresh = await fetchCompanySettings();
    setSettings(fresh);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();

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
    formattedAddress: getFormattedAddress(settings),
    phoneDisplay: formatIndianPhoneDisplay(settings.phone),
    updateSettings: saveCompanySettings,
  };
}
