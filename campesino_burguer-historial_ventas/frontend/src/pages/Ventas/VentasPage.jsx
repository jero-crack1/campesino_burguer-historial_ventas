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
      title={hasStock ? `Agregar ${receta.nombre}` : 'Sin stock'}
    >
      {/* Image */}
      <div
        className="w-full overflow-hidden flex items-center justify-center"
        style={{ aspectRatio: '4/3', background: 'var(--surface-2)' }}
      >
        {receta.imagen_url && !imgError ? (
          <img
            src={receta.imagen_url}
            alt={receta.nombre}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-1" style={{ color: 'var(--ink-faint)' }}>
            <ImageOff className="w-8 h-8" />
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className="font-semibold text-sm leading-tight line-clamp-2">{receta.nombre}</p>
        <p className="text-base font-bold" style={{ color: 'var(--accent-text)' }}>
          {formatCurrency(receta.precio_venta)}
        </p>
        <p className="text-xs" style={{ color: hasStock ? 'var(--ink-muted)' : 'var(--danger-text)' }}>
          {hasStock
            ? `Stock: ${formatNum(receta.stock_actual)} ${receta.unidad_produccion}`
            : 'Sin stock'}
        </p>
      </div>

      {/* Hover overlay */}
      {hasStock && (
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.35)' }}
        >
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
      {/* Thumb */}
      <div
        className="rounded-lg overflow-hidden shrink-0"
        style={{ width: 48, height: 48, background: 'var(--surface-2)' }}
      >
        {item.receta.imagen_url ? (
          <img src={item.receta.imagen_url} alt={item.receta.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--ink-faint)' }}>
            <ImageOff className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Name + subtotal */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-1">{item.receta.nombre}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
          {formatCurrency(item.receta.precio_venta)} × {item.cantidad}
        </p>
        <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--accent-text)' }}>
          {formatCurrency(subtotal)}
        </p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button" size="icon" variant="outline"
          className="h-7 w-7"
          onClick={() => onChangeQty(item.receta.id, -1)}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="w-7 text-center text-sm font-medium">{item.cantidad}</span>
        <Button
          type="button" size="icon" variant="outline"
          className="h-7 w-7"
          onClick={() => onChangeQty(item.receta.id, 1)}
        >
          <Plus className="w-3 h-3" />
        </Button>
        <Button
          type="button" size="icon" variant="ghost"
          className="h-7 w-7 ml-1 text-[var(--danger)]"
          onClick={() => onRemove(item.receta.id)}
        >
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
  const [mode, setMode] = useState('list'); // 'list' | 'cart'
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // Cart state
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [cliente, setCliente] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [v, r] = await Promise.all([api.get('/ventas'), api.get('/recetas')]);
      setVentas(v.data);
      setRecetas(r.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredRecetas = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return recetas;
    return recetas.filter((r) => r.nombre.toLowerCase().includes(q));
  }, [recetas, search]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + parseFloat(item.receta.precio_venta) * item.cantidad, 0),
    [cart],
  );

  const openCart = () => {
    setCart([]);
    setSearch('');
    setCliente('');
    setFecha(new Date().toISOString().slice(0, 10));
    setMode('cart');
  };

  const addToCart = (receta) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.receta.id === receta.id);
      if (existing) {
        const maxQty = parseFloat(receta.stock_actual);
        if (existing.cantidad >= maxQty) {
          toast.error(`Stock máximo: ${formatNum(maxQty)} ${receta.unidad_produccion}`);
          return prev;
        }
        return prev.map((i) => i.receta.id === receta.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { receta, cantidad: 1 }];
    });
  };

  const changeQty = (recetaId, delta) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.receta.id !== recetaId) return i;
          const maxQty = parseFloat(i.receta.stock_actual);
          const next = i.cantidad + delta;
          if (next < 1) return null;
          if (next > maxQty) {
            toast.error(`Stock máximo: ${formatNum(maxQty)} ${i.receta.unidad_produccion}`);
            return i;
          }
          return { ...i, cantidad: next };
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (recetaId) => {
    setCart((prev) => prev.filter((i) => i.receta.id !== recetaId));
  };

  const submitVenta = async () => {
    if (cart.length === 0) { toast.error('El carrito está vacío'); return; }
    setSaving(true);
    try {
      await api.post('/ventas', {
        fecha,
        cliente: cliente.trim() || undefined,
        detalles: cart.map((i) => ({ receta_id: i.receta.id, cantidad: i.cantidad })),
      });
      toast.success('Venta registrada');
      setMode('list');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/ventas/${selected.id}`);
      toast.success('Venta eliminada');
      setConfirmOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'fecha', label: 'Fecha', render: (r) => r.fecha },
    { key: 'cliente', label: 'Cliente', render: (r) => r.cliente || <span style={{ color: 'var(--ink-faint)' }}>—</span> },
    { key: 'items', label: 'Ítems', render: (r) => r.detalles?.length || 0 },
    { key: 'total', label: 'Total', render: (r) => <span className="font-semibold">{formatCurrency(r.total)}</span> },
    {
      key: 'actions', label: '', width: 100,
      render: (r) => (
        <span className="flex items-center gap-1 justify-end">
          <Button size="icon" variant="ghost" onClick={() => { setSelected(r); setDetailOpen(true); }}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="text-[var(--danger)]" onClick={() => { setSelected(r); setConfirmOpen(true); }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </span>
      ),
    },
  ];

  // ── CART VIEW ──────────────────────────────────────────────────────────────
  if (mode === 'cart') {
    return (
      <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <Button variant="ghost" size="icon" onClick={() => setMode('list')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-semibold text-base">Nueva venta</h1>

          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Fecha</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Cliente</Label>
              <Input
                placeholder="Opcional"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="h-8 text-xs w-40"
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Products panel */}
          <div className="flex flex-col flex-1 min-w-0 p-5 gap-4" style={{ overflowY: 'auto' }}>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ink-muted)' }} />
              <Input
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Grid */}
            {filteredRecetas.length === 0 ? (
              <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--ink-muted)' }}>
                <p className="text-sm">No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                {filteredRecetas.map((r) => (
                  <ProductCard key={r.id} receta={r} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>

          {/* Cart panel */}
          <div
            className="flex flex-col shrink-0"
            style={{
              width: 320,
              borderLeft: '1px solid var(--border)',
              background: 'var(--surface)',
            }}
          >
            {/* Cart header */}
            <div
              className="flex items-center gap-2 px-5 py-4 shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <ShoppingCart className="w-4 h-4" style={{ color: 'var(--accent-text)' }} />
              <span className="font-semibold text-sm">Carrito</span>
              {cart.length > 0 && (
                <span
                  className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                >
                  {cart.length}
                </span>
              )}
            </div>

            {/* Cart items */}
            <div className="flex-1 px-5 overflow-y-auto" style={{ minHeight: 0 }}>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-10" style={{ color: 'var(--ink-muted)' }}>
                  <ShoppingCart className="w-10 h-10 opacity-30" />
                  <p className="text-sm text-center">Selecciona productos del catálogo</p>
                </div>
              ) : (
                cart.map((item) => (
                  <CartItem
                    key={item.receta.id}
                    item={item}
                    onChangeQty={changeQty}
                    onRemove={removeFromCart}
                  />
                ))
              )}
            </div>

            {/* Cart footer */}
            <div className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>Total</span>
                <span className="text-xl font-bold" style={{ color: 'var(--accent-text)' }}>
                  {formatCurrency(cartTotal)}
                </span>
              </div>
              <Button
                className="w-full"
                onClick={submitVenta}
                disabled={cart.length === 0 || saving}
              >
                {saving ? 'Registrando...' : 'Confirmar venta'}
              </Button>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  className="w-full mt-2 text-xs"
                  onClick={() => setCart([])}
                >
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
      <PageHeader
        title="Ventas"
        description="Registro de ventas de productos"
        action={
          <Button onClick={openCart}>
            <Plus className="w-4 h-4" />Nueva venta
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={ventas}
        loading={loading}
        emptyTitle="Sin ventas"
        emptyDescription="Registra tu primera venta."
      />

      {/* Detail Modal */}
      <FormModal open={detailOpen} onOpenChange={setDetailOpen} title={`Venta #${selected?.id}`} hideSubmit>
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span style={{ color: 'var(--ink-muted)' }}>Fecha:</span> <span className="ml-1 font-medium">{selected.fecha}</span></div>
              <div><span style={{ color: 'var(--ink-muted)' }}>Cliente:</span> <span className="ml-1 font-medium">{selected.cliente || '—'}</span></div>
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
            <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="font-semibold">Total: {formatCurrency(selected.total)}</span>
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar venta"
        description="¿Estás seguro? Esta acción no se puede deshacer y el stock NO se restaura automáticamente."
        onConfirm={onDelete}
        loading={deleting}
      />
    </>
  );
}
