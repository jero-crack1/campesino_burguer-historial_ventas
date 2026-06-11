import { Badge } from '@/components/ui/badge';
import { formatNum } from '@/lib/utils';

export default function StockBadge({ stock, minimo, unidad }) {
  const val = parseFloat(stock || 0);
  const min = parseFloat(minimo || 0);

  let variant = 'success';
  let label = 'OK';

  if (val <= 0) { variant = 'danger'; label = 'Sin stock'; }
  else if (val <= min) { variant = 'warning'; label = 'Stock bajo'; }

  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[var(--ink)]">{formatNum(val)} {unidad}</span>
      <Badge variant={variant}>{label}</Badge>
    </span>
  );
}
