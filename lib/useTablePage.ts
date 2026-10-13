'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

// Keep lists bounded; filtering runs in PostgreSQL before pagination, not just
// over the first page. Supabase RLS checks current access on every request.
export function useTablePage<T>({ table, columns, search, searchColumns, sort = 'created_at', filterColumn, filterValue }: {
  table: string; columns: string; search: string; searchColumns: readonly string[]; sort?: string;
  filterColumn?: string; filterValue?: string;
}) {
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const searchFields = searchColumns.join(',');
  const queryKey = JSON.stringify([table, debouncedSearch, filterColumn, filterValue]);
  const [pagination, setPagination] = useState({ key: queryKey, index: 0 });
  const page = pagination.key === queryKey ? pagination.index : 0;
  const pageSize = 25;
  const setPage = useCallback((index: number) => setPagination({ key: queryKey, index: Math.max(0, index) }), [queryKey]);
  const reload = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 180);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true); setError('');
      try {
        let query = supabase.from(table).select(columns, { count: 'exact' })
          .order(sort, { ascending: false, ...(sort === 'last_visit' ? { nullsFirst: false } : {}) }).order('id', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1).abortSignal(controller.signal);
        if (filterColumn && filterValue && filterValue !== 'all') query = query.eq(filterColumn, filterValue);
        // PostgREST OR expressions have their own grammar: keep user input out
        // of delimiters/operators while preserving letters, digits, and spaces.
        const term = debouncedSearch.trim().slice(0, 100).replace(/[^\p{L}\p{N}\s@.+-]/gu, '');
        if (debouncedSearch.trim() && !term) {
          setRows([]); setTotal(0); return;
        }
        if (term) query = query.or(searchFields.split(',').map(field => `${field}.ilike.%${term}%`).join(','));
        const { data, count, error: queryError } = await query;
        if (!active) return;
        if (queryError) throw queryError;
        setTotal(count || 0);
        if (page > 0 && page * pageSize >= (count || 0)) {
          setPagination({ key: queryKey, index: Math.max(0, Math.ceil((count || 0) / pageSize) - 1) });
          return;
        }
        setRows((data || []) as unknown as T[]);
      } catch {
        if (active) { setError('Unable to load records. Check your connection and try again.'); setRows([]); }
      } finally { if (active) setLoading(false); }
    });
    return () => { active = false; controller.abort(); };
  }, [table, columns, debouncedSearch, searchFields, sort, filterColumn, filterValue, page, revision, queryKey]);

  return { rows, setRows, total, loading, error, page, pageSize, setPage, reload };
}
