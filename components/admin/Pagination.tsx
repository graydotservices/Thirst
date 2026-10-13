'use client';

export default function Pagination({ page, pageSize, total, loading, onChange }: {
  page: number; pageSize: number; total: number; loading: boolean; onChange: (page: number) => void;
}) {
  if (!total) return null;
  return <nav aria-label="Table pages" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 0' }}>
    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
      {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total.toLocaleString('en-IN')}
    </span>
    <div style={{ display: 'flex', gap: 8 }}>
      <button className="btn btn-secondary btn-sm" disabled={loading || page === 0} onClick={() => onChange(page - 1)}>Previous</button>
      <button className="btn btn-secondary btn-sm" disabled={loading || (page + 1) * pageSize >= total} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  </nav>;
}
