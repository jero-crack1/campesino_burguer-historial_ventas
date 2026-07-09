import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Eye, ArrowLeft, Search, ShoppingCart, Minus, ImageOff } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatNum } from '@/lib/utils';

const ORDEN_CATEGORIAS = [
  'Entradas', 'Burgers', 'Patacón', 'Salchipapas', 'Mazorcada',
  'Perros Calientes', 'Parrilla', 'Pizza', 'Adicionales', 'Bebidas', 'Sodas',
];

const METODOS_TRANSFERENCIA = ['Nequi', 'Daviplata', 'Bre-B', 'Bold'];

function formatCurrency(n) {
  return `$${parseFloat(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function ProductCard({ receta, onAdd }) {
  const hasStock = parseFloat(receta.stock_actual) > 0;
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={() => hasStock && onAdd(receta)}
      disabled={!hasStock}
      className="group relative flex flex-col rounded-xl border overflow-hidden text-left transition-all duration-150 w-full"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        opacity: hasStock ? 1 : 0.5,
        cursor: hasStock ? 'pointer' : 'not-allowed',
      }}
    >
      <div className="w-full overflow-hidden flex items-center justify-center" style={{ aspectRatio: '4/3', background: 'var(--surface-2)' }}>
        {receta.imagen_url && !imgError ? (
          <img src={receta.imagen_url} alt={receta.nombre} onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105" />
        ) : (
          <div className="flex flex-col items-center gap-1" style={{ color: 'var(--ink-faint)' }}>
            <ImageOff className="w-8 h-8" />
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className="font-semibold text-sm leading-tight line-clamp-2">{receta.nombre}</p>
        <p className="text-base font-bold" style={{ color: 'var(--accent-text)' }}>{formatCurrency(receta.precio_venta)}</p>
        <p className="text-xs" style={{ color: hasStock ? 'var(--ink-muted)' : 'var(--danger-text)' }}>
          {hasStock ? `Stock: ${formatNum(receta.stock_actual)}` : 'Sin stock'}
        </p>
      </div>
      {hasStock && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.35)' }}>
          <span className="text-white font-semibold text-sm px-3 py-1.5 rounded-full" style={{ background: 'var(--accent)' }}>
            + Agregar
          </span>
        </div>
      )}
    </button>
  );
}

function CartItem({ item, onChangeQty, onRemove }) {
  const subtotal = parseFloat(item.receta.precio_venta) * item.cantidad;
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="rounded-lg overflow-hidden shrink-0" style={{ width: 48, height: 48, background: 'var(--surface-2)' }}>
        {item.receta.imagen_url ? (
          <img src={item.receta.imagen_url} alt={item.receta.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--ink-faint)' }}>
            <ImageOff className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-1">{item.receta.nombre}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
          {formatCurrency(item.receta.precio_venta)} × {item.cantidad}
        </p>
        <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--accent-text)' }}>{formatCurrency(subtotal)}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => onChangeQty(item.receta.id, -1)}>
          <Minus className="w-3 h-3" />
        </Button>
        <span className="w-7 text-center text-sm font-medium">{item.cantidad}</span>
        <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => onChangeQty(item.receta.id, 1)}>
          <Plus className="w-3 h-3" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7 ml-1 text-[var(--danger)]" onClick={() => onRemove(item.receta.id)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mode, setMode] = useState('list');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');
  const [cliente, setCliente] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  // Payment state
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [impoconsumo, setImpoconsumo] = useState('');
  const [valorRecibido, setValorRecibido] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [v, r] = await Promise.all([api.get('/ventas'), api.get('/recetas')]);
      setVentas(v.data);
      setRecetas(r.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categorias = useMemo(() => {
    const presentes = new Set(recetas.map((r) => r.categoria).filter(Boolean));
    return ['Todos', ...ORDEN_CATEGORIAS.filter((c) => presentes.has(c))];
  }, [recetas]);

  const filteredRecetas = useMemo(() => {
    let list = recetas;
    if (categoriaFiltro !== 'Todos') list = list.filter((r) => r.categoria === categoriaFiltro);
    const q = search.toLowerCase().trim();
    if (q) list = list.filter((r) => r.nombre.toLowerCase().includes(q));
    return list;
  }, [recetas, categoriaFiltro, search]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + parseFloat(item.receta.precio_venta) * item.cantidad, 0),
    [cart],
  );

  const impoconsumoValor = useMemo(() => {
    const pct = parseFloat(impoconsumo) || 0;
    return parseFloat((cartTotal * pct / 100).toFixed(2));
  }, [cartTotal, impoconsumo]);

  const totalFinal = useMemo(() => cartTotal + impoconsumoValor, [cartTotal, impoconsumoValor]);

  const cambio = useMemo(() => {
    if (metodoPago !== 'Efectivo') return 0;
    const recibido = parseFloat(valorRecibido) || 0;
    return Math.max(0, recibido - totalFinal);
  }, [metodoPago, valorRecibido, totalFinal]);

  const efectivoInsuficiente = useMemo(() => {
    if (metodoPago !== 'Efectivo') return false;
    const recibido = parseFloat(valorRecibido) || 0;
    return recibido < totalFinal;
  }, [metodoPago, valorRecibido, totalFinal]);

  const openCart = () => {
    setCart([]); setSearch(''); setCategoriaFiltro('Todos');
    setCliente(''); setFecha(new Date().toISOString().slice(0, 10));
    setMetodoPago('Efectivo'); setImpoconsumo(''); setValorRecibido('');
    setMode('cart');
  };

  const addToCart = (receta) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.receta.id === receta.id);
      if (existing) {
        if (existing.cantidad >= parseFloat(receta.stock_actual)) {
          toast.error(`Stock máximo: ${formatNum(receta.stock_actual)}`);
          return prev;
        }
        return prev.map((i) => i.receta.id === receta.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { receta, cantidad: 1 }];
    });
  };

  const changeQty = (recetaId, delta) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.receta.id !== recetaId) return i;
        const next = i.cantidad + delta;
        if (next < 1) return null;
        if (next > parseFloat(i.receta.stock_actual)) { toast.error(`Stock máximo: ${formatNum(i.receta.stock_actual)}`); return i; }
        return { ...i, cantidad: next };
      }).filter(Boolean)
    );
  };

  const removeFromCart = (recetaId) => setCart((prev) => prev.filter((i) => i.receta.id !== recetaId));

  const submitVenta = async () => {
    if (cart.length === 0) { toast.error('El carrito está vacío'); return; }
    if (metodoPago === 'Efectivo' && (!valorRecibido || efectivoInsuficiente)) {
      toast.error('Ingresa un valor recibido suficiente'); return;
    }
    setSaving(true);
    try {
      await api.post('/ventas', {
        fecha,
        cliente: cliente.trim() || undefined,
        detalles: cart.map((i) => ({ receta_id: i.receta.id, cantidad: i.cantidad })),
        metodoPago,
        impoconsumoPocentaje: parseFloat(impoconsumo) || 0,
        valorRecibido: metodoPago === 'Efectivo' ? parseFloat(valorRecibido) : undefined,
      });
      toast.success('Venta registrada');
      setMode('list'); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/ventas/${selected.id}`);
      toast.success('Venta eliminada'); setConfirmOpen(false); load();
    } catch (e) { toast.error(e.message); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'fecha', label: 'Fecha', render: (r) => r.fecha },
    { key: 'cliente', label: 'Cliente', render: (r) => r.cliente || <span style={{ color: 'var(--ink-faint)' }}>—</span> },
    { key: 'metodo_pago', label: 'Pago', render: (r) => r.metodo_pago || <span style={{ color: 'var(--ink-faint)' }}>—</span> },
    { key: 'items', label: 'Ítems', render: (r) => r.detalles?.length || 0 },
    { key: 'total', label: 'Total', render: (r) => <span className="font-semibold">{formatCurrency(r.total)}</span> },
    {
      key: 'actions', label: '', width: 100,
      render: (r) => (
        <span className="flex items-center gap-1 justify-end">
          <Button size="icon" variant="ghost" onClick={() => { setSelected(r); setDetailOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant="ghost" className="text-[var(--danger)]" onClick={() => { setSelected(r); setConfirmOpen(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
        </span>
      ),
    },
  ];

  // ── CART VIEW ──────────────────────────────────────────────────────────────
  if (mode === 'cart') {
    const confirmDisabled = cart.length === 0 || saving ||
      (metodoPago === 'Efectivo' && (!valorRecibido || efectivoInsuficiente));

    return (
      <div style={{ position: 'fixed', top: 0, left: '14rem', right: 0, bottom: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <Button variant="ghost" size="icon" onClick={() => setMode('list')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-semibold text-base">Nueva venta</h1>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-8 text-xs w-36" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Cliente</Label>
              <Input placeholder="Opcional" value={cliente} onChange={(e) => setCliente(e.target.value)} className="h-8 text-xs w-40" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Products panel */}
          <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

            {/* Buscador + filtros — fijos, no scrollean */}
            <div style={{ padding: '16px 20px 10px', flexShrink: 0, borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ink-muted)' }} />
                <Input placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {categorias.map((cat) => {
                  const active = categoriaFiltro === cat;
                  return (
                    <button key={cat} type="button" onClick={() => setCategoriaFiltro(cat)}
                      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: active ? 'var(--accent)' : 'var(--surface-2)',
                        color: active ? 'var(--accent-foreground)' : 'var(--ink-muted)',
                        border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                      }}>
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid de productos — solo esta parte scrollea */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px', minHeight: 0 }}>
              {filteredRecetas.length === 0 ? (
                <div className="flex items-center justify-center h-full" style={{ color: 'var(--ink-muted)' }}>
                  <p className="text-sm">No se encontraron productos</p>
                </div>
              ) : (
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                  {filteredRecetas.map((r) => <ProductCard key={r.id} receta={r} onAdd={addToCart} />)}
                </div>
              )}
            </div>
          </div>

          {/* Cart panel */}
          <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0, borderLeft: '1px solid var(--border)', background: 'var(--surface)' }}>
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <ShoppingCart className="w-4 h-4" style={{ color: 'var(--accent-text)' }} />
              <span className="font-semibold text-sm">Carrito</span>
              {cart.length > 0 && (
                <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                  {cart.length}
                </span>
              )}
            </div>

            {/* Items */}
            <div className="px-5 overflow-y-auto" style={{ flex: 1, minHeight: 0 }}>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-10" style={{ color: 'var(--ink-muted)' }}>
                  <ShoppingCart className="w-10 h-10 opacity-30" />
                  <p className="text-sm text-center">Selecciona productos del catálogo</p>
                </div>
              ) : (
                cart.map((item) => <CartItem key={item.receta.id} item={item} onChangeQty={changeQty} onRemove={removeFromCart} />)
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 shrink-0 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>

              {/* Método de pago */}
              <div>
                <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>Método de pago</p>
                <div className="flex flex-col gap-1.5">
                  {/* Efectivo — ancho completo */}
                  <button type="button"
                    onClick={() => { setMetodoPago('Efectivo'); setValorRecibido(''); }}
                    className="w-full py-2.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: metodoPago === 'Efectivo' ? 'var(--accent)' : 'var(--surface-2)',
                      color: metodoPago === 'Efectivo' ? 'var(--accent-foreground)' : 'var(--ink)',
                      border: metodoPago === 'Efectivo' ? '1px solid var(--accent)' : '1px solid var(--border)',
                    }}>
                    Efectivo
                  </button>
                  {/* Transferencias — 2×2 */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {METODOS_TRANSFERENCIA.map((m) => {
                      const isActive = metodoPago === m;
                      return (
                        <button key={m} type="button"
                          onClick={() => { setMetodoPago(m); setValorRecibido(''); }}
                          className="py-2.5 rounded-lg text-xs font-bold transition-all"
                          style={{
                            background: isActive ? 'var(--accent)' : 'var(--surface-2)',
                            color: isActive ? 'var(--accent-foreground)' : 'var(--ink)',
                            border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                          }}>
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Efectivo: valor recibido y cambio */}
              {metodoPago === 'Efectivo' && (
                <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap" style={{ color: 'var(--ink-muted)' }}>Valor recibido</Label>
                    <Input
                      type="number" min="0" placeholder="$0"
                      value={valorRecibido}
                      onChange={(e) => setValorRecibido(e.target.value)}
                      className="h-8 text-xs flex-1"
                      style={{ borderColor: valorRecibido && efectivoInsuficiente ? 'var(--danger)' : undefined }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--ink-muted)' }}>Cambio</span>
                    <span className="font-semibold"
                      style={{ color: valorRecibido && efectivoInsuficiente ? 'var(--danger-text)' : 'var(--accent-text)' }}>
                      {valorRecibido && efectivoInsuficiente ? 'Insuficiente' : formatCurrency(cambio)}
                    </span>
                  </div>
                </div>
              )}

              {/* Impoconsumo */}
              <div>
                <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>Impoconsumo</p>
                <div className="relative">
                  <Input
                    type="number" min="0" max="100" step="0.1"
                    placeholder="0"
                    value={impoconsumo}
                    onChange={(e) => setImpoconsumo(e.target.value)}
                    className="pr-8 text-xs h-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: 'var(--ink-muted)' }}>%</span>
                </div>
              </div>

              {/* Totales */}
              <div className="space-y-1 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--ink-muted)' }}>Subtotal</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                {impoconsumoValor > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--ink-muted)' }}>Impoconsumo ({impoconsumo}%)</span>
                    <span>{formatCurrency(impoconsumoValor)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-xl font-bold" style={{ color: 'var(--accent-text)' }}>{formatCurrency(totalFinal)}</span>
                </div>
              </div>

              <Button className="w-full" onClick={submitVenta} disabled={confirmDisabled}>
                {saving ? 'Registrando...' : 'Confirmar venta'}
              </Button>
              {cart.length > 0 && (
                <Button variant="ghost" className="w-full text-xs" onClick={() => setCart([])}>
                  Limpiar carrito
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader title="Ventas" description="Registro de ventas de productos"
        action={<Button onClick={openCart}><Plus className="w-4 h-4" />Nueva venta</Button>} />
      <DataTable columns={columns} data={ventas} loading={loading} emptyTitle="Sin ventas" emptyDescription="Registra tu primera venta." />

      <FormModal open={detailOpen} onOpenChange={setDetailOpen} title={`Venta #${selected?.id}`} hideSubmit>
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span style={{ color: 'var(--ink-muted)' }}>Fecha:</span> <span className="ml-1 font-medium">{selected.fecha}</span></div>
              <div><span style={{ color: 'var(--ink-muted)' }}>Cliente:</span> <span className="ml-1 font-medium">{selected.cliente || '—'}</span></div>
              {selected.metodo_pago && (
                <div><span style={{ color: 'var(--ink-muted)' }}>Método de pago:</span> <span className="ml-1 font-medium">{selected.metodo_pago}</span></div>
              )}
              {parseFloat(selected.valor_recibido) > 0 && (
                <div><span style={{ color: 'var(--ink-muted)' }}>Recibido:</span> <span className="ml-1 font-medium">{formatCurrency(selected.valor_recibido)}</span></div>
              )}
              {parseFloat(selected.cambio) > 0 && (
                <div><span style={{ color: 'var(--ink-muted)' }}>Cambio:</span> <span className="ml-1 font-medium">{formatCurrency(selected.cambio)}</span></div>
              )}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--ink-muted)' }}>ÍTEMS</p>
              <div className="space-y-1.5">
                {selected.detalles?.map((d) => (
                  <div key={d.id} className="flex justify-between text-sm">
                    <span>{d.receta?.nombre}</span>
                    <span style={{ color: 'var(--ink-muted)' }}>
                      {formatNum(d.cantidad)} × {formatCurrency(d.precio_unitario)} = <strong>{formatCurrency(d.subtotal)}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
              {parseFloat(selected.descuento_aplicado) > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--ink-muted)' }}>Descuento:</span>
                  <span style={{ color: 'var(--danger-text)' }}>- {formatCurrency(selected.descuento_aplicado)}</span>
                </div>
              )}
              <div className="flex justify-end">
                <span className="font-semibold">Total: {formatCurrency(selected.total)}</span>
              </div>
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Eliminar venta"
        description="¿Estás seguro? Esta acción no se puede deshacer y el stock NO se restaura automáticamente."
        onConfirm={onDelete} loading={deleting} />
    </>
  );
}
