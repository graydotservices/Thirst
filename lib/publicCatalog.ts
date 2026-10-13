import 'server-only';
import type { MenuItem } from './catalog';

export async function publicCatalog(): Promise<{ items: MenuItem[]; error: string }> {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!base?.startsWith('https://') || !key) throw new Error('Not configured');
    const items: MenuItem[] = [];
    for (let offset = 0; ; offset += 500) {
      const url = new URL('/rest/v1/products', base);
      url.search = new URLSearchParams({ select: 'id,name,category,price,image,description,stock,is_available',
        is_available: 'eq.true', stock: 'gt.0', order: 'name.asc,id.asc', limit: '500', offset: String(offset) }).toString();
      // Only anonymous, publicly readable menu data enters this cache. Never
      // forward a visitor's token/cookies or use the service-role key here.
      const response = await fetch(url, { cache: 'force-cache', headers: { apikey: key, Authorization: `Bearer ${key}` },
        next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error('Catalog unavailable');
      const batch = await response.json() as MenuItem[];
      items.push(...batch);
      if (batch.length < 500) break;
      if (offset >= 9500) throw new Error('Catalog too large');
    }
    return { items, error: '' };
  } catch {
    return { items: [], error: 'The menu could not be loaded. Please try again.' };
  }
}
