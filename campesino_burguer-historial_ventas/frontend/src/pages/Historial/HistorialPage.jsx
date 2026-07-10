import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, ArrowUpDown, SlidersHorizontal, Download, Trash2, RotateCcw,
  Eye, ShoppingCart, ReceiptText, X, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatNum } from '@/lib/utils';

function formatCurrency(n) {
  return `$${parseFloat(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function formatFecha(f) {
  if (!f) return '—';
  return new Date(f + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}
function ticketId(id) {
  return `#${String(id).padStart(6, '0')}`;
}

function normalizeVenta(v) {
  return {
    id: v.id,
    uid: `venta-${v.id}`,
    tipo: 'venta',
    fecha: v.fecha,
    tercero: v.cliente || 'Cliente no registrado',
    metodoPago: v.metodo_pago || null,
    estado: v.estado || 'activa',
    descuento: parseFloat(v.descuento_aplicado || 0),
    valorRecibido: parseFloat(v.valor_recibido || 0),
    cambio: parseFloat(v.cambio || 0),
    articulos: (v.detalles || []).map((d) => ({
      nombre: d.receta?.nombre || '—',
      cantidad: parseFloat(d.cantidad),
      precio: parseFloat(d.precio_unitario),
      subtotal: parseFloat(d.subtotal),
    })),
    total: parseFloat(v.total),
  };
}

function normalizeCompra(c) {
  return {
    id: c.id,
    uid: `compra-${c.id}`,
    tipo: 'compra',
    fecha: c.fecha,
    tercero: c.proveedor || 'Proveedor no especificado',
    metodoPago: null,
    estado: 'activa',
    descuento: 0,
    valorRecibido: 0,
    cambio: 0,
    articulos: (c.detalles || []).map((d) => ({
      nombre: d.materiaPrima?.nombre || d.materia_prima?.nombre || '—',
      cantidad: parseFloat(d.cantidad),
      precio: parseFloat(d.precio_unitario),
      subtotal: parseFloat(d.subtotal),
    })),
    total: parseFloat(c.total),
  };
}

function MovimientoCard({ mov, onDetail, onPapelera, onRestore, onFactura }) {
  const esVenta = mov.tipo === 'venta';
  const enPapelera = mov.estado === 'papelera';
  const resumen = mov.articulos.slice(0, 3).map((a) => a.nombre).join(', ');
  const totalArticulos = mov.articulos.reduce((s, a) => s + a.cantidad, 0);

  return (
    <div className="rounded-xl border p-4 flex flex-col gap-3 transition-all"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: esVenta ? 'var(--success-subtle)' : 'var(--accent)22',
              color: esVenta ? 'var(--success-text)' : 'var(--accent-text)',
            }}>
            {esVenta ? <ReceiptText className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
            {esVenta ? 'Venta' : 'Compra'}
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{ticketId(mov.id)}</span>
          {enPapelera && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--danger-subtle)', color: 'var(--danger-text)' }}>
              Papelera
            </span>
          )}
        </div>
        <span className="text-xs shrink-0" style={{ color: 'var(--ink-muted)' }}>{formatFecha(mov.fecha)}</span>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{mov.tercero}</p>
        {mov.metodoPago && (
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{mov.metodoPago}</p>
        )}
        <p className="text-xs line-clamp-1" style={{ color: 'var(--ink-faint)' }}>
          {totalArticulos} ítem{totalArticulos !== 1 ? 's' : ''} · {resumen}{mov.articulos.length > 3 ? '...' : ''}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-lg font-bold" style={{ color: 'var(--accent-text)' }}>{formatCurrency(mov.total)}</span>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDetail(mov)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          {esVenta && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onFactura(mov)}
              title="Ver factura">
              <FileText className="w-3.5 h-3.5" />
            </Button>
          )}
          {esVenta && !enPapelera && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-[var(--danger)]" onClick={() => onPapelera(mov)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
          {enPapelera && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onRestore(mov)}
              style={{ color: 'var(--success-text)' }}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HistorialPage() {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [view, setView] = useState('historial');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ tipo: '', fechaDesde: '', fechaHasta: '', montoMin: '', montoMax: '', metodoPago: '' });
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rv, rc] = await Promise.all([api.get('/ventas'), api.get('/compras')]);
      const ventas = (rv.data || []).map(normalizeVenta);
      const compras = (rc.data || []).map(normalizeCompra);
      setMovimientos([...ventas, ...compras]);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = movimientos;

    if (view === 'historial') list = list.filter((m) => m.estado !== 'papelera');
    else list = list.filter((m) => m.tipo === 'venta' && m.estado === 'papelera');

    const q = search.toLowerCase().trim();
    if (q) list = list.filter((m) =>
      String(m.id).includes(q) ||
      m.fecha.includes(q) ||
      m.tipo.includes(q) ||
      m.tercero.toLowerCase().includes(q) ||
      m.articulos.some((a) => a.nombre.toLowerCase().includes(q))
    );

    if (filters.tipo) list = list.filter((m) => m.tipo === filters.tipo);
    if (filters.fechaDesde) list = list.filter((m) => m.fecha >= filters.fechaDesde);
    if (filters.fechaHasta) list = list.filter((m) => m.fecha <= filters.fechaHasta);
    if (filters.montoMin) list = list.filter((m) => m.total >= parseFloat(filters.montoMin));
    if (filters.montoMax) list = list.filter((m) => m.total <= parseFloat(filters.montoMax));
    if (filters.metodoPago) list = list.filter((m) => m.metodoPago === filters.metodoPago);

    return [...list].sort((a, b) => {
      const d = new Date(a.fecha) - new Date(b.fecha);
      return sortAsc ? d : -d;
    });
  }, [movimientos, view, search, filters, sortAsc]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const clearFilters = () => setFilters({ tipo: '', fechaDesde: '', fechaHasta: '', montoMin: '', montoMax: '', metodoPago: '' });

  const openDetail = (mov) => { setSelected(mov); setDetailOpen(true); };

  const openFactura = (mov) => navigate(`/factura/${mov.id}`);

  const askPapelera = (mov) => { setConfirmTarget(mov); setConfirmAction('papelera'); setConfirmOpen(true); };

  const askRestore = (mov) => { setConfirmTarget(mov); setConfirmAction('restore'); setConfirmOpen(true); };

  const doConfirm = async () => {
    if (!confirmTarget) return;
    try {
      const nuevoEstado = confirmAction === 'papelera' ? 'papelera' : 'activa';
      await api.put(`/ventas/${confirmTarget.id}`, { estado: nuevoEstado });
      toast.success(confirmAction === 'papelera' ? 'Movida a papelera' : 'Restaurada');
      setConfirmOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const downloadTxt = () => {
    const lines = [
      'REPORTE DE MOVIMIENTOS — CAMPESINO BURGER',
      `Generado: ${new Date().toLocaleString('es-CO')}`,
      `Total registros: ${filtered.length}`,
      '─'.repeat(60),
      '',
    ];
    for (const m of filtered) {
      lines.push(`${m.tipo.toUpperCase()} ${ticketId(m.id)} — ${formatFecha(m.fecha)}`);
      lines.push(`  ${m.tipo === 'venta' ? 'Cliente' : 'Proveedor'}: ${m.tercero}`);
      if (m.metodoPago) lines.push(`  Método de pago: ${m.metodoPago}`);
      for (const a of m.articulos) {
        lines.push(`  • ${a.nombre}: ${formatNum(a.cantidad)} × ${formatCurrency(a.precio)} = ${formatCurrency(a.subtotal)}`);
      }
      if (m.descuento > 0) lines.push(`  Descuento: -${formatCurrency(m.descuento)}`);
      lines.push(`  TOTAL: ${formatCurrency(m.total)}`);
      lines.push('');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reporte-movimientos-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const papeleraCount = movimientos.filter((m) => m.tipo === 'venta' && m.estado === 'papelera').length;

  return (
    <div className="space-y-4">
      <PageHeader title="Historial" description="Ventas y compras registradas" />

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--ink-faint)' }} />
          <Input placeholder="Buscar por ticket, fecha, cliente, producto…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={() => setSortAsc((p) => !p)} className="gap-1.5 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortAsc ? 'Más antiguos' : 'Más recientes'}
        </Button>

        <Button variant="outline" size="sm" onClick={() => setShowFilters((p) => !p)} className="gap-1.5 shrink-0 relative">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold"
              style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
              {activeFilterCount}
            </span>
          )}
        </Button>

        <Button variant="outline" size="sm" onClick={downloadTxt} className="gap-1.5 shrink-0">
          <Download className="w-3.5 h-3.5" />
          Descargar
        </Button>

        <Button
          variant={view === 'papelera' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView((v) => v === 'papelera' ? 'historial' : 'papelera')}
          className="gap-1.5 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Papelera {papeleraCount > 0 && `(${papeleraCount})`}
        </Button>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <select value={filters.tipo} onChange={(e) => setFilters((f) => ({ ...f, tipo: e.target.value }))}
                className="mt-1 h-8 w-full rounded-md border text-xs px-2"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)' }}>
                <option value="">Todos</option>
                <option value="venta">Ventas</option>
                <option value="compra">Compras</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Desde</Label>
              <Input type="date" value={filters.fechaDesde} onChange={(e) => setFilters((f) => ({ ...f, fechaDesde: e.target.value }))}
                className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Hasta</Label>
              <Input type="date" value={filters.fechaHasta} onChange={(e) => setFilters((f) => ({ ...f, fechaHasta: e.target.value }))}
                className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Monto mín.</Label>
              <Input type="number" min="0" placeholder="$0" value={filters.montoMin}
                onChange={(e) => setFilters((f) => ({ ...f, montoMin: e.target.value }))} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Monto máx.</Label>
              <Input type="number" min="0" placeholder="Sin límite" value={filters.montoMax}
                onChange={(e) => setFilters((f) => ({ ...f, montoMax: e.target.value }))} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Método de pago</Label>
              <select value={filters.metodoPago} onChange={(e) => setFilters((f) => ({ ...f, metodoPago: e.target.value }))}
                className="mt-1 h-8 w-full rounded-md border text-xs px-2"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)' }}>
                <option value="">Todos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Nequi">Nequi</option>
                <option value="Daviplata">Daviplata</option>
                <option value="Bre-B">Bre-B</option>
                <option value="Bold">Bold</option>
                <option value="Crédito">Crédito</option>
              </select>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3 gap-1.5 text-xs">
              <X className="w-3 h-3" /> Limpiar filtros
            </Button>
          )}
        </div>
      )}

      {/* Contador */}
      {!loading && (
        <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
          {view === 'papelera' ? `${filtered.length} en papelera` : `${filtered.length} movimiento${filtered.length !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--ink-muted)' }}>
          <p className="text-sm">Cargando movimientos…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink-muted)' }}>
          <ReceiptText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{view === 'papelera' ? 'La papelera está vacía' : 'No hay movimientos'}</p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MovimientoCard key={m.uid} mov={m}
              onDetail={openDetail}
              onFactura={openFactura}
              onPapelera={askPapelera}
              onRestore={askRestore}
            />
          ))}
        </div>
      )}

      {/* Modal detalle */}
      <FormModal open={detailOpen} onOpenChange={setDetailOpen}
        title={selected ? `${selected.tipo === 'venta' ? 'Venta' : 'Compra'} ${ticketId(selected.id)}` : ''}
        hideSubmit>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span style={{ color: 'var(--ink-muted)' }}>Fecha:</span> <span className="ml-1 font-medium">{formatFecha(selected.fecha)}</span></div>
              <div>
                <span style={{ color: 'var(--ink-muted)' }}>{selected.tipo === 'venta' ? 'Cliente:' : 'Proveedor:'}</span>
                <span className="ml-1 font-medium">{selected.tercero}</span>
              </div>
              {selected.metodoPago && (
                <div><span style={{ color: 'var(--ink-muted)' }}>Método de pago:</span> <span className="ml-1 font-medium">{selected.metodoPago}</span></div>
              )}
              {selected.estado !== 'activa' && (
                <div><span style={{ color: 'var(--ink-muted)' }}>Estado:</span>
                  <span className="ml-1 font-medium capitalize" style={{ color: 'var(--danger-text)' }}>{selected.estado}</span>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>
                {selected.tipo === 'venta' ? 'Productos' : 'Materias primas'}
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Ítem', 'Cant.', selected.tipo === 'venta' ? 'Precio unit.' : 'Costo unit.', 'Subtotal'].map((h) => (
                      <th key={h} className="text-left pb-2 text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.articulos.map((a, i) => (
                    <tr key={i} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                      <td className="py-2 pr-2 text-sm">{a.nombre}</td>
                      <td className="py-2 pr-2 text-sm">{formatNum(a.cantidad)}</td>
                      <td className="py-2 pr-2 text-sm">{formatCurrency(a.precio)}</td>
                      <td className="py-2 text-sm font-medium">{formatCurrency(a.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {selected.descuento > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--ink-muted)' }}>Descuento</span>
                  <span style={{ color: 'var(--danger-text)' }}>- {formatCurrency(selected.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span style={{ color: 'var(--accent-text)' }}>{formatCurrency(selected.total)}</span>
              </div>
              {selected.valorRecibido > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--ink-muted)' }}>Recibido</span>
                    <span>{formatCurrency(selected.valorRecibido)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--ink-muted)' }}>Cambio</span>
                    <span>{formatCurrency(selected.cambio)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmAction === 'papelera' ? 'Mover a papelera' : 'Restaurar venta'}
        description={
          confirmAction === 'papelera'
            ? `¿Mover la venta ${confirmTarget ? ticketId(confirmTarget.id) : ''} a papelera? No se elimina definitivamente.`
            : `¿Restaurar la venta ${confirmTarget ? ticketId(confirmTarget.id) : ''} al historial?`
        }
        onConfirm={doConfirm}
      />
    </div>
  );
}
