import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const UNIDADES = ['kg', 'g', 'mg', 'L', 'mL', 'm', 'unidad', 'docena', 'paquete', 'caja', 'porción'];

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCOP(value) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatNum(value, decimals = 3) {
  return parseFloat(value || 0).toFixed(decimals).replace(/\.?0+$/, '');
}

// null | 'programada' | 'vigente' | 'expirada'
export function estadoPromocion(receta) {
  if (!receta?.en_promocion || receta.precio_promocion == null) return null;
  const hoy = new Date().toISOString().slice(0, 10);
  if (receta.promocion_desde && hoy < receta.promocion_desde) return 'programada';
  if (receta.promocion_hasta && hoy > receta.promocion_hasta) return 'expirada';
  return 'vigente';
}

// Precio de venta real de una receta ahora mismo: el promocional si está vigente, si no el normal.
export function precioEfectivo(receta) {
  return estadoPromocion(receta) === 'vigente' ? parseFloat(receta.precio_promocion) : parseFloat(receta.precio_venta);
}
