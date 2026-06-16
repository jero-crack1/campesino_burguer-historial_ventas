import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

export default function DataTable({ columns, data, loading, emptyTitle, emptyDescription, keyField = 'id', maxHeight }) {
  if (loading) return <LoadingSpinner />;
  if (!data?.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
      <div style={{ overflowX: 'auto', overflowY: maxHeight ? 'auto' : undefined, maxHeight }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)',
              position: maxHeight ? 'sticky' : undefined,
              top: 0,
              zIndex: 1,
            }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row[keyField] ?? i}
                className="transition-colors duration-100 hover:bg-[var(--surface-2)]"
                style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-[var(--ink)]">
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
