import { useState, useEffect, useCallback } from 'react';

export type Category = {
  id: string;
  label: string;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cakes', label: 'Cakes' },
  { id: 'ice-cream', label: 'Ice Creams' },
  { id: 'special-desserts', label: 'Special Desserts' },
  { id: 'waffles', label: 'Waffles & Pancakes' },
  { id: 'thick-shakes', label: 'Thick Shakes & Beverages' },
];

const STORAGE_KEY = 'thirst_product_categories_cache';
const UPDATE_EVENT_KEY = 'thirst_product_categories_updated';

export function slugifyCategory(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

export function formatCategoryLabel(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getCachedCategories(productCategories: string[] = []): Category[] {
  let storedList: Category[] = DEFAULT_CATEGORIES;

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          storedList = parsed;
        }
      }
    } catch {
      // fallback
    }
  }

  // Merge any categories currently present in live products
  const categoryMap = new Map<string, string>();
  storedList.forEach(c => categoryMap.set(c.id, c.label));

  productCategories.forEach(rawCat => {
    if (!rawCat) return;
    const slug = slugifyCategory(rawCat);
    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, formatCategoryLabel(rawCat));
    }
  });

  return Array.from(categoryMap.entries()).map(([id, label]) => ({ id, label }));
}

export function saveCategory(name: string): Category {
  const cleanName = name.trim();
  const slug = slugifyCategory(cleanName);
  const label = cleanName.length > 0 ? formatCategoryLabel(cleanName) : slug;

  const current = getCachedCategories();
  const existingIndex = current.findIndex(c => c.id === slug);

  let updatedList: Category[];
  const newCat = { id: slug, label };

  if (existingIndex >= 0) {
    updatedList = [...current];
    updatedList[existingIndex] = newCat;
  } else {
    updatedList = [...current, newCat];
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent(UPDATE_EVENT_KEY, { detail: updatedList }));
    } catch {}
  }

  return newCat;
}

export function deleteCategory(id: string): void {
  const current = getCachedCategories();
  const updatedList = current.filter(c => c.id !== id);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent(UPDATE_EVENT_KEY, { detail: updatedList }));
    } catch {}
  }
}

export function useCategories(productCategories: string[] = []) {
  const [categories, setCategories] = useState<Category[]>(() => getCachedCategories(productCategories));

  const reload = useCallback(() => {
    const list = getCachedCategories(productCategories);
    setCategories(list);
  }, [productCategories]);

  useEffect(() => {
    reload();

    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) {
        setCategories(detail);
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
    categories,
    addCategory: saveCategory,
    removeCategory: deleteCategory,
    reload,
  };
}
