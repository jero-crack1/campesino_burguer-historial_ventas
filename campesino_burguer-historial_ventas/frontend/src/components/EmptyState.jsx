import { PackageOpen } from 'lucide-react';

export default function EmptyState({ title = 'Sin registros', description = 'Crea el primer registro para comenzar.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-[var(--radius)] border border-dashed border-[var(--border)]">
      <PackageOpen className="w-10 h-10 text-[var(--ink-faint)] mb-3" strokeWidth={1.5} />
      <p className="text-sm font-medium text-[var(--ink)]">{title}</p>
      <p className="text-sm text-[var(--ink-muted)] mt-1 max-w-xs">{description}</p>
    </div>
  );
}
