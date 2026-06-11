import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const UNIDADES = ['kg', 'g', 'mg', 'L', 'mL', 'unidad', 'docena', 'paquete', 'caja', 'porción'];

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
