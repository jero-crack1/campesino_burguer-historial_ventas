import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function formatCurrency(n) {
  return `$${parseFloat(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function formatNum(n) {
  return parseFloat(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 3 });
}

function StatCard({ icon: Icon, label, value, sub, color = 'var(--accent)' }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '22' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{label}</span>
      </div>
      <p className="text-2xl font-semibold" style={{ color: 'var(--ink)' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>{sub}</p>}
    </div>
  );
}

export default function ReportesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [desde, setDesde] = useState(firstOfMonth);
  const [hasta, setHasta] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rentabilidad, setRentabilidad] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        api.get(`/reportes/ventas?desde=${desde}&hasta=${hasta}`),
        api.get(`/reportes/ventas/productos-top?desde=${desde}&hasta=${hasta}&limite=10`),
      ]);
      setData({ resumen: r1.data.resumen, top: r2.data });
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const loadRentabilidad = async () => {
    try {
      const r = await api.get('/reportes/rentabilidad');
      setRentabilidad(r.data);
    } catch { /* silent */ }
  };

  useEffect(() => { load(); loadRentabilidad(); }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" description="Análisis de ventas y rentabilidad" />

      {/* Filtro período */}
      <div className="flex items-end gap-3 flex-wrap" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
        <div>
          <Label className="text-xs">Desde</Label>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="mt-1 h-8 text-sm w-36" />
        </div>
        <div>
          <Label className="text-xs">Hasta</Label>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="mt-1 h-8 text-sm w-36" />
        </div>
        <Button size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Tarjetas resumen */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={ShoppingBag} label="Total ventas" value={data.resumen.total_ventas} sub="en el período seleccionado" />
          <StatCard icon={DollarSign} label="Ingresos totales" value={formatCurrency(data.resumen.ingresos_totales)} sub="suma de todas las ventas" color="var(--success)" />
          <StatCard icon={BarChart3} label="Promedio por venta" value={formatCurrency(data.resumen.promedio_por_venta)} sub="ingreso promedio" color="var(--warning)" />
        </div>
      )}

      {/* Top productos */}
      {data?.top?.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Productos más vendidos</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>{desde} → {hasta}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['#', 'Receta', 'Cantidad vendida', 'Ventas', 'Ingresos'].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.top.map((r) => (
                <tr key={r.receta_id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--ink-muted)' }}>{r.posicion}</td>
                  <td className="px-4 py-2.5 font-medium">{r.nombre}</td>
                  <td className="px-4 py-2.5">{formatNum(r.cantidad_vendida)}</td>
                  <td className="px-4 py-2.5">{r.num_ventas}</td>
                  <td className="px-4 py-2.5 font-semibold">{formatCurrency(r.ingresos_generados)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.top?.length === 0 && !loading && (
        <div className="text-center py-8" style={{ color: 'var(--ink-muted)' }}>
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay ventas en el período seleccionado</p>
        </div>
      )}

      {/* Rentabilidad */}
      {rentabilidad?.recetas?.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Rentabilidad por receta</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>Margen promedio: <strong>{rentabilidad.promedio_margen}%</strong></p>
            </div>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--success)' }} />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['Receta', 'Precio venta', 'Costo prod.', 'Margen', '%'].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rentabilidad.recetas.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2.5 font-medium">{r.nombre}</td>
                  <td className="px-4 py-2.5">{formatCurrency(r.precio_venta)}</td>
                  <td className="px-4 py-2.5">{formatCurrency(r.costo_produccion)}</td>
                  <td className="px-4 py-2.5">{formatCurrency(r.margen)}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        background: r.margen_pct >= 30 ? 'var(--success-subtle)' : r.margen_pct >= 10 ? 'var(--warning-subtle)' : 'var(--danger-subtle)',
                        color: r.margen_pct >= 30 ? 'var(--success-text)' : r.margen_pct >= 10 ? 'var(--warning-text)' : 'var(--danger-text)',
                      }}
                    >
                      {r.margen_pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
