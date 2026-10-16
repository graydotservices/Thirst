import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { getCachedCompanySettings, formatIndianPhoneDisplay } from './companySettings';

export type StoreLocation = {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  map_url?: string;
  is_flagship?: boolean;
  is_active: boolean;
  created_at?: string;
};

const STORAGE_KEY = 'thirst_store_locations_cache';
const UPDATE_EVENT_KEY = 'thirst_store_locations_updated';

export const INITIAL_BRANCH_LOCATIONS: StoreLocation[] = [
  {
    id: 'loc-flagship',
    name: 'Thirst. Thiruvallur — Flagship',
    address: 'NO.01, Siva Vishnu kovil street, kakkalur, Thiruvallur, Tamil Nadu - 602001',
    city: 'Thiruvallur',
    phone: '+91 87548 81546',
    hours: '2:00 PM – 12:00 AM',
    map_url: 'https://maps.google.com/?q=NO.01,+Siva+Vishnu+kovil+street,+kakkalur,+Thiruvallur',
    is_flagship: true,
    is_active: true,
  },
];

export function getDirectionsUrl(name: string, address: string, customUrl?: string): string {
  if (customUrl && customUrl.trim().startsWith('http')) return customUrl.trim();
  const query = encodeURIComponent(`${name}, ${address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function getCachedStoreLocations(): StoreLocation[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
  }
  return INITIAL_BRANCH_LOCATIONS;
}

export async function fetchStoreLocations(): Promise<StoreLocation[]> {
  const fallback = getCachedStoreLocations();
  try {
    const { data, error } = await supabase
      .from('store_locations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return fallback;
    }

    const mapped: StoreLocation[] = data.map(d => ({
      id: d.id,
      name: d.name,
      address: d.address,
      city: d.city,
      phone: d.phone || '',
      hours: d.hours || '2:00 PM – 12:00 AM',
      map_url: getDirectionsUrl(d.name, d.address),
      is_flagship: d.name.toLowerCase().includes('flagship'),
      is_active: d.is_active ?? true,
      created_at: d.created_at,
    }));

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
      } catch {}
    }

    return mapped;
  } catch {
    return fallback;
  }
}

export async function saveStoreLocation(
  loc: Omit<StoreLocation, 'id'> & { id?: string }
): Promise<{ success: boolean; data?: StoreLocation; error?: string }> {
  try {
    const isEdit = Boolean(loc.id && !loc.id.startsWith('loc-temp-'));
    const payload = {
      name: loc.name.trim(),
      address: loc.address.trim(),
      city: loc.city.trim(),
      phone: loc.phone?.trim() || '',
      hours: loc.hours?.trim() || '2:00 PM – 12:00 AM',
      is_active: loc.is_active,
    };

    let savedItem: StoreLocation = {
      ...payload,
      id: loc.id || `loc-temp-${Date.now()}`,
      is_flagship: loc.is_flagship || loc.name.toLowerCase().includes('flagship'),
      map_url: getDirectionsUrl(payload.name, payload.address, loc.map_url),
      created_at: new Date().toISOString(),
    };

    // Attempt save to Supabase
    try {
      if (isEdit && loc.id) {
        const { data, error } = await supabase
          .from('store_locations')
          .update(payload)
          .eq('id', loc.id)
          .select()
          .maybeSingle();

        if (!error && data) {
          savedItem = {
            ...savedItem,
            id: data.id,
            created_at: data.created_at,
          };
        }
      } else {
        const { data, error } = await supabase
          .from('store_locations')
          .insert([payload])
          .select()
          .maybeSingle();

        if (!error && data) {
          savedItem = {
            ...savedItem,
            id: data.id,
            created_at: data.created_at,
          };
        }
      }
    } catch {
      // Local fallback keeps working
    }

    // Update local cache
    const current = getCachedStoreLocations();
    const exists = current.some(x => x.id === savedItem.id);
    const updatedList = exists
      ? current.map(x => (x.id === savedItem.id ? savedItem : x))
      : [savedItem, ...current];

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT_KEY, { detail: updatedList }));
      } catch {}
    }

    return { success: true, data: savedItem };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err instanceof Error ? err.message : '') || 'Failed to save store location',
    };
  }
}

export async function deleteStoreLocation(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      await supabase.from('store_locations').delete().eq('id', id);
    } catch {}

    const current = getCachedStoreLocations();
    const updatedList = current.filter(x => x.id !== id);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT_KEY, { detail: updatedList }));
      } catch {}
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err instanceof Error ? err.message : '') || 'Failed to delete store location',
    };
  }
}

export function useStoreLocations() {
  const [locations, setLocations] = useState<StoreLocation[]>(INITIAL_BRANCH_LOCATIONS);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const fresh = await fetchStoreLocations();
    setLocations(fresh);
    setLoading(false);
  }, []);

  useEffect(() => {
    const cached = getCachedStoreLocations();
    setLocations(cached);
    void Promise.resolve().then(reload);

    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) {
        setLocations(detail);
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
    locations,
    loading,
    reload,
    saveLocation: saveStoreLocation,
    removeLocation: deleteStoreLocation,
  };
}
