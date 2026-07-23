import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Eye, ArrowLeft, Search, ShoppingCart, Minus, ImageOff, Pencil, Ban } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatNum, precioEfectivo, estadoPromocion } from '@/lib/utils';

const OBSERVACIONES_MAX = 200;

// Todas las opciones (de todos los grupos) de un combo, en una sola lista plana
function opcionesDelCombo(receta) {
  return (receta.comboGrupos || []).flatMap((g) => g.opciones);
}

// Precio unitario efectivo de una línea de carrito: precio base + adicionales de los componentes elegidos
function precioUnitarioDe(item) {
  if (!item.componentes) return precioEfectivo(item.receta);
  const opciones = opcionesDelCombo(item.receta);
  const adicional = item.componentes.reduce((s, c) => {
    const opcion = opciones.find((o) => o.receta_id === c.receta_id);
    return s + parseFloat(opcion?.precio_adicional || 0);
  }, 0);
  return precioEfectivo(item.receta) + adicional;
}

// Requerimientos reales de stock de una línea: la receta misma (ítem simple) o sus componentes elegidos (combo)
function requerimientosDeLinea(item) {
  if (item.componentes) {
    return item.componentes.map((c) => ({ receta_id: c.receta_id, cantidad: item.cantidad }));
  }
  return [{ receta_id: item.receta.id, cantidad: item.cantidad }];
}

function componentesKey(componentes) {
  return JSON.stringify(
    [...componentes].sort((a, b) => a.combo_grupo_id - b.combo_grupo_id || a.receta_id - b.receta_id)
  );
}

function lineKeyFor(receta, componentes) {
  return componentes ? `${receta.id}::${componentesKey(componentes)}` : String(receta.id);
}

// Cuánto de cada receta ya está comprometido en el carrito (opcionalmente ignorando una línea, para edición)
function reservadoPorReceta(cart, excludeLineKey) {
  const map = new Map();
  for (const item of cart) {
    if (item.lineKey === excludeLineKey) continue;
    for (const req of requerimientosDeLinea(item)) {
      map.set(req.receta_id, (map.get(req.receta_id) || 0) + req.cantidad);
    }
  }
  return map;
}

const ORDEN_CATEGORIAS = [
  'Entradas', 'Burgers', 'Patacón', 'Salchipapas', 'Mazorcada',
  'Perros Calientes', 'Parrilla', 'Pizza', 'Adicionales', 'Bebidas', 'Sodas',
];

const METODOS_PAGO_DIGITAL = ['Nequi', 'Daviplata', 'Bre-B', 'Bold'];
const CANALES_DESCUENTO_EMPLEADO = ['Domicilio', 'Rappi'];

function formatCurrency(n) {
  return `$${parseFloat(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function ProductCard({ receta, onAdd }) {
  const hasStock = receta.es_combo
    ? (receta.comboGrupos || []).every((g) => !g.obligatorio || g.opciones.some((o) => parseFloat(o.receta?.stock_actual || 0) > 0))
    : parseFloat(receta.stock_actual) > 0;
  const [imgError, setImgError] = useState(false);
  const enPromo = estadoPromocion(receta) === 'vigente';

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
      <div className="w-full overflow-hidden flex items-center justify-center relative" style={{ aspectRatio: '4/3', background: 'var(--surface-2)' }}>
        {receta.es_combo && (
          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full z-10"
            style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
            COMBO
          </span>
        )}
        {enPromo && (
          <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full z-10"
            style={{ background: 'var(--danger)', color: 'white' }}>
            PROMO
          </span>
        )}
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
        {enPromo ? (
          <p className="flex items-baseline gap-1.5">
            <span className="text-xs line-through" style={{ color: 'var(--ink-faint)' }}>{formatCurrency(receta.precio_venta)}</span>
            <span className="text-base font-bold" style={{ color: 'var(--danger-text)' }}>{formatCurrency(receta.precio_promocion)}</span>
          </p>
        ) : (
          <p className="text-base font-bold" style={{ color: 'var(--accent-text)' }}>{formatCurrency(receta.precio_venta)}</p>
        )}
        <p className="text-xs" style={{ color: hasStock ? 'var(--ink-muted)' : 'var(--danger-text)' }}>
          {hasStock ? (receta.es_combo ? 'Personalizable' : `Stock: ${formatNum(receta.stock_actual)}`) : 'Sin stock'}
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

function CartItem({ item, onChangeQty, onRemove, onEdit }) {
  const precioUnitario = precioUnitarioDe(item);
  const subtotal = precioUnitario * item.cantidad;
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
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
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium leading-tight line-clamp-1">{item.receta.nombre}</p>
          {item.componentes && (
            <button type="button" onClick={() => onEdit(item)} title="Editar componentes" className="shrink-0">
              <Pencil className="w-3 h-3" style={{ color: 'var(--ink-muted)' }} />
            </button>
          )}
        </div>
        {item.componentes?.length > 0 && (
          <ul className="mt-0.5">
            {item.componentes.map((c, idx) => {
              const grupo = item.receta.comboGrupos?.find((g) => g.id === c.combo_grupo_id);
              const opcion = grupo?.opciones.find((o) => o.receta_id === c.receta_id);
              const adicional = parseFloat(opcion?.precio_adicional || 0);
              return (
                <li key={idx} className="text-xs leading-tight" style={{ color: 'var(--ink-muted)' }}>
                  {grupo?.nombre}: {opcion?.receta?.nombre}{adicional > 0 ? ` (+${formatCurrency(adicional)})` : ''}
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
          {formatCurrency(precioUnitario)} × {item.cantidad}
        </p>
        <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--accent-text)' }}>{formatCurrency(subtotal)}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button type="button" size="icon" variant="outline" className="h-8 w-8 sm:h-7 sm:w-7" onClick={() => onChangeQty(item.lineKey, -1)}>
          <Minus className="w-3 h-3" />
        </Button>
        <span className="w-7 text-center text-sm font-medium">{item.cantidad}</span>
        <Button type="button" size="icon" variant="outline" className="h-8 w-8 sm:h-7 sm:w-7" onClick={() => onChangeQty(item.lineKey, 1)}>
          <Plus className="w-3 h-3" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 sm:h-7 sm:w-7 ml-1 text-[var(--danger)]" onClick={() => onRemove(item.lineKey)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function ComboCustomizeModal({ open, onOpenChange, receta, initialComponentes, reservado, onConfirm }) {
  const [seleccion, setSeleccion] = useState({});

  useEffect(() => {
    if (!open || !receta) return;
    const init = {};
    for (const grupo of receta.comboGrupos || []) {
      if (initialComponentes) {
        init[grupo.id] = initialComponentes.filter((c) => c.combo_grupo_id === grupo.id).map((c) => c.receta_id);
      } else {
        const porDefecto = grupo.opciones.find((o) => o.es_default);
        init[grupo.id] = porDefecto ? [porDefecto.receta_id] : [];
      }
    }
    setSeleccion(init);
  }, [open, receta, initialComponentes]);

  if (!receta) return null;

  const disponibleDe = (opcion) => {
    const stock = parseFloat(opcion.receta?.stock_actual || 0);
    const reservadoOtros = reservado?.get(opcion.receta_id) || 0;
    return stock - reservadoOtros;
  };

  const toggleUnica = (grupo, recetaId) => setSeleccion((s) => ({ ...s, [grupo.id]: [recetaId] }));

  const toggleMultiple = (grupo, recetaId) => setSeleccion((s) => {
    const actual = s[grupo.id] || [];
    if (actual.includes(recetaId)) return { ...s, [grupo.id]: actual.filter((id) => id !== recetaId) };
    if (actual.length >= grupo.max_selecciones) return s;
    return { ...s, [grupo.id]: [...actual, recetaId] };
  });

  const total = precioEfectivo(receta) + (receta.comboGrupos || []).reduce((sum, grupo) => {
    const elegidos = seleccion[grupo.id] || [];
    return sum + elegidos.reduce((s, recetaId) => {
      const opcion = grupo.opciones.find((o) => o.receta_id === recetaId);
      return s + parseFloat(opcion?.precio_adicional || 0);
    }, 0);
  }, 0);

  const handleConfirm = () => {
    for (const grupo of receta.comboGrupos || []) {
      const count = (seleccion[grupo.id] || []).length;
      if (count < grupo.min_selecciones || count > grupo.max_selecciones) {
        toast.error(`"${grupo.nombre}" requiere entre ${grupo.min_selecciones} y ${grupo.max_selecciones} opción(es)`);
        return;
      }
    }
    const componentes = (receta.comboGrupos || []).flatMap((grupo) =>
      (seleccion[grupo.id] || []).map((recetaId) => ({ combo_grupo_id: grupo.id, receta_id: recetaId }))
    );
    onConfirm(componentes);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Personalizar "${receta.nombre}"`}
      description="Ajusta los componentes de este combo según lo que pidió el cliente."
      onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}
      submitLabel="Agregar al carrito"
    >
      <div className="space-y-4">
        {(receta.comboGrupos || []).map((grupo) => (
          <div key={grupo.id}>
            <div className="flex items-center gap-2 mb-1.5">
              <Label className="!mb-0">{grupo.nombre}</Label>
              <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                {grupo.obligatorio ? `(elige ${grupo.min_selecciones === grupo.max_selecciones ? grupo.min_selecciones : `${grupo.min_selecciones}-${grupo.max_selecciones}`})` : '(opcional)'}
              </span>
            </div>
            <div className="space-y-1">
              {grupo.opciones.map((opcion) => {
                const seleccionado = (seleccion[grupo.id] || []).includes(opcion.receta_id);
                const disponible = disponibleDe(opcion);
                const sinStock = disponible <= 0 && !seleccionado;
                const esMultiple = grupo.max_selecciones > 1;
                return (
                  <label
                    key={opcion.id}
                    className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md cursor-pointer"
                    style={{
                      background: seleccionado ? 'var(--surface-2)' : 'transparent',
                      opacity: sinStock ? 0.5 : 1,
                      cursor: sinStock ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <input
                      type={esMultiple ? 'checkbox' : 'radio'}
                      name={`grupo-${grupo.id}`}
                      checked={seleccionado}
                      disabled={sinStock}
                      onChange={() => esMultiple ? toggleMultiple(grupo, opcion.receta_id) : toggleUnica(grupo, opcion.receta_id)}
                    />
                    <span className="flex-1">{opcion.receta?.nombre}</span>
                    {parseFloat(opcion.precio_adicional) > 0 && (
                      <span style={{ color: 'var(--ink-muted)' }}>+{formatCurrency(opcion.precio_adicional)}</span>
                    )}
                    {sinStock && <span className="text-xs" style={{ color: 'var(--danger-text)' }}>Sin stock</span>}
                  </label>
                );
              })}
              {!grupo.obligatorio && (
                <label className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md cursor-pointer">
                  <input
                    type="radio"
                    name={`grupo-${grupo.id}`}
                    checked={(seleccion[grupo.id] || []).length === 0}
                    onChange={() => setSeleccion((s) => ({ ...s, [grupo.id]: [] }))}
                  />
                  <span style={{ color: 'var(--ink-muted)' }}>Ninguno</span>
                </label>
              )}
            </div>
          </div>
        ))}
        <div className="flex justify-between pt-2 font-semibold" style={{ borderTop: '1px solid var(--border)' }}>
          <span>Total</span>
          <span style={{ color: 'var(--accent-text)' }}>{formatCurrency(total)}</span>
        </div>
      </div>
    </FormModal>
  );
}

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('list');
  const [anularOpen, setAnularOpen] = useState(false);
  const [anuladoPorInput, setAnuladoPorInput] = useState('');
  const [motivoInput, setMotivoInput] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');
  const [cliente, setCliente] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [comboModalReceta, setComboModalReceta] = useState(null);
  const [comboEditingLineKey, setComboEditingLineKey] = useState(null);
  const [comboInitialComponentes, setComboInitialComponentes] = useState(null);

  // Payment state
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [impoconsumo, setImpoconsumo] = useState('');
  const [valorRecibido, setValorRecibido] = useState('');
  const [aplicaDescuento, setAplicaDescuento] = useState(false);
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState('');
  const [descuentoEmpleado, setDescuentoEmpleado] = useState('');
  const [autorizadoPor, setAutorizadoPor] = useState('');
  const [observaciones, setObservaciones] = useState('');

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
    () => cart.reduce((sum, item) => sum + precioUnitarioDe(item) * item.cantidad, 0),
    [cart],
  );

  const esCanalConDescuento = CANALES_DESCUENTO_EMPLEADO.includes(metodoPago);

  const descuentoValor = useMemo(() => {
    if (!esCanalConDescuento || !aplicaDescuento) return 0;
    const pct = Math.min(100, Math.max(0, parseFloat(descuentoPorcentaje) || 0));
    return parseFloat((cartTotal * pct / 100).toFixed(2));
  }, [cartTotal, esCanalConDescuento, aplicaDescuento, descuentoPorcentaje]);

  const subtotalConDescuento = useMemo(() => cartTotal - descuentoValor, [cartTotal, descuentoValor]);

  const impoconsumoValor = useMemo(() => {
    const pct = parseFloat(impoconsumo) || 0;
    return parseFloat((subtotalConDescuento * pct / 100).toFixed(2));
  }, [subtotalConDescuento, impoconsumo]);

  const totalFinal = useMemo(() => subtotalConDescuento + impoconsumoValor, [subtotalConDescuento, impoconsumoValor]);

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
    setAplicaDescuento(false); setDescuentoPorcentaje(''); setDescuentoEmpleado(''); setAutorizadoPor('');
    setObservaciones('');
    setMode('cart');
  };

  const addToCart = (receta) => {
    setCart((prev) => {
      const lineKey = String(receta.id);
      const existing = prev.find((i) => i.lineKey === lineKey);
      if (existing) {
        if (existing.cantidad >= parseFloat(receta.stock_actual)) {
          toast.error(`Stock máximo: ${formatNum(receta.stock_actual)}`);
          return prev;
        }
        return prev.map((i) => i.lineKey === lineKey ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { lineKey, receta, cantidad: 1, componentes: undefined }];
    });
  };

  const openComboModal = (receta) => {
    setComboModalReceta(receta);
    setComboEditingLineKey(null);
    setComboInitialComponentes(null);
    setComboModalOpen(true);
  };

  const openComboEdit = (item) => {
    setComboModalReceta(item.receta);
    setComboEditingLineKey(item.lineKey);
    setComboInitialComponentes(item.componentes);
    setComboModalOpen(true);
  };

  const handleCardAdd = (receta) => receta.es_combo ? openComboModal(receta) : addToCart(receta);

  const handleComboConfirm = (componentes) => {
    const receta = comboModalReceta;
    const nuevaLineKey = lineKeyFor(receta, componentes);
    setCart((prev) => {
      if (comboEditingLineKey) {
        const viejoItem = prev.find((i) => i.lineKey === comboEditingLineKey);
        const sinViejo = prev.filter((i) => i.lineKey !== comboEditingLineKey);
        const destino = sinViejo.find((i) => i.lineKey === nuevaLineKey);
        if (destino) {
          return sinViejo.map((i) => i.lineKey === nuevaLineKey ? { ...i, cantidad: i.cantidad + viejoItem.cantidad } : i);
        }
        return [...sinViejo, { ...viejoItem, lineKey: nuevaLineKey, componentes }];
      }
      const existente = prev.find((i) => i.lineKey === nuevaLineKey);
      if (existente) {
        return prev.map((i) => i.lineKey === nuevaLineKey ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { lineKey: nuevaLineKey, receta, cantidad: 1, componentes }];
    });
    setComboModalOpen(false);
  };

  const changeQty = (lineKey, delta) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.lineKey === lineKey);
      if (idx === -1) return prev;
      const next = prev[idx].cantidad + delta;
      if (next < 1) return prev.filter((i) => i.lineKey !== lineKey);

      const hipotetico = prev.map((i, j) => j === idx ? { ...i, cantidad: next } : i);
      const totales = new Map();
      for (const item of hipotetico) {
        for (const req of requerimientosDeLinea(item)) {
          totales.set(req.receta_id, (totales.get(req.receta_id) || 0) + req.cantidad);
        }
      }
      for (const [recetaId, cantidadTotal] of totales) {
        const r = recetas.find((x) => x.id === recetaId);
        const stockTotal = parseFloat(r?.stock_actual || 0);
        if (cantidadTotal > stockTotal) {
          toast.error(`Stock máximo alcanzado${r ? ` para "${r.nombre}"` : ''}`);
          return prev;
        }
      }
      return hipotetico;
    });
  };

  const removeFromCart = (lineKey) => setCart((prev) => prev.filter((i) => i.lineKey !== lineKey));

  const submitVenta = async () => {
    if (cart.length === 0) { toast.error('El carrito está vacío'); return; }
    if (metodoPago === 'Crédito' && !cliente.trim()) {
      toast.error('Ingresa el nombre del cliente para registrar el crédito'); return;
    }
    if (metodoPago === 'Efectivo' && (!valorRecibido || efectivoInsuficiente)) {
      toast.error('Ingresa un valor recibido suficiente'); return;
    }
    if (esCanalConDescuento && aplicaDescuento) {
      if (!descuentoPorcentaje || parseFloat(descuentoPorcentaje) <= 0) {
        toast.error('Ingresa el porcentaje de descuento'); return;
      }
      if (!descuentoEmpleado.trim()) { toast.error('Ingresa el nombre del empleado'); return; }
      if (!autorizadoPor.trim()) { toast.error('Ingresa quién autorizó el descuento'); return; }
    }
    setSaving(true);
    try {
      await api.post('/ventas', {
        fecha,
        cliente: cliente.trim() || undefined,
        detalles: cart.map((i) => ({
          receta_id: i.receta.id,
          cantidad: i.cantidad,
          ...(i.componentes ? { componentes: i.componentes } : {}),
        })),
        metodoPago,
        impoconsumoPocentaje: parseFloat(impoconsumo) || 0,
        valorRecibido: metodoPago === 'Efectivo' ? parseFloat(valorRecibido) : undefined,
        ...(esCanalConDescuento && aplicaDescuento ? {
          descuentoPorcentaje: parseFloat(descuentoPorcentaje) || 0,
          descuentoEmpleado: descuentoEmpleado.trim(),
          autorizadoPor: autorizadoPor.trim(),
        } : {}),
        observaciones: observaciones.trim() || undefined,
      });
      toast.success('Venta registrada');
      setMode('list'); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const askAnular = (r) => {
    setSelected(r); setAnuladoPorInput(''); setMotivoInput(''); setAnularOpen(true);
  };

  const doAnular = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!anuladoPorInput.trim()) { toast.error('Indica quién anula la venta'); return; }
    setAnulando(true);
    try {
      await api.patch(`/ventas/${selected.id}/anular`, { anuladoPor: anuladoPorInput.trim(), motivo: motivoInput.trim() });
      toast.success('Venta anulada — el stock fue restaurado');
      setAnularOpen(false); load();
    } catch (e) { toast.error(e.message); }
    finally { setAnulando(false); }
  };

  const columns = [
    { key: 'fecha', label: 'Fecha', render: (r) => r.fecha },
    { key: 'cliente', label: 'Cliente', render: (r) => r.cliente || <span style={{ color: 'var(--ink-faint)' }}>—</span> },
    { key: 'metodo_pago', label: 'Pago', render: (r) => r.metodo_pago || <span style={{ color: 'var(--ink-faint)' }}>—</span> },
    { key: 'items', label: 'Ítems', render: (r) => r.detalles?.length || 0 },
    { key: 'total', label: 'Total', render: (r) => <span className="font-semibold">{formatCurrency(r.total)}</span> },
    {
      key: 'estado', label: 'Estado',
      render: (r) => r.estado === 'anulada'
        ? <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--danger-subtle)', color: 'var(--danger-text)' }}>Anulada</span>
        : <span style={{ color: 'var(--ink-faint)' }}>—</span>,
    },
    {
      key: 'actions', label: '', width: 100,
      render: (r) => (
        <span className="flex items-center gap-1 justify-end">
          <Button size="icon" variant="ghost" onClick={() => { setSelected(r); setDetailOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
          {r.estado !== 'anulada' && (
            <Button size="icon" variant="ghost" className="text-[var(--danger)]" onClick={() => askAnular(r)} title="Anular venta">
              <Ban className="w-3.5 h-3.5" />
            </Button>
          )}
        </span>
      ),
    },
  ];

  // ── CART VIEW ──────────────────────────────────────────────────────────────
  if (mode === 'cart') {
    const confirmDisabled = cart.length === 0 || saving ||
      (metodoPago === 'Crédito' && !cliente.trim()) ||
      (metodoPago === 'Efectivo' && (!valorRecibido || efectivoInsuficiente)) ||
      (esCanalConDescuento && aplicaDescuento && (
        !descuentoPorcentaje || parseFloat(descuentoPorcentaje) <= 0 ||
        !descuentoEmpleado.trim() || !autorizadoPor.trim()
      ));

    return (
      <div className="fixed inset-0 z-50 flex flex-col lg:left-56" style={{ background: 'var(--background)' }}>
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 sm:px-6 py-3 sm:py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <Button variant="ghost" size="icon" onClick={() => setMode('list')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-semibold text-base">Nueva venta</h1>
          <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-8 text-xs w-36" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Cliente{metodoPago === 'Crédito' ? ' *' : ''}</Label>
              <Input
                placeholder={metodoPago === 'Crédito' ? 'Requerido para crédito' : 'Opcional'}
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="h-8 text-xs w-40"
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Products panel */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col">

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
                  {filteredRecetas.map((r) => <ProductCard key={r.id} receta={r} onAdd={handleCardAdd} />)}
                </div>
              )}
            </div>
          </div>

          {/* Cart panel */}
          <div
            className="flex-1 min-h-0 w-full md:flex-none md:w-[340px] md:flex-shrink-0 flex flex-col border-t md:border-t-0 md:border-l"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
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
                cart.map((item) => <CartItem key={item.lineKey} item={item} onChangeQty={changeQty} onRemove={removeFromCart} onEdit={openComboEdit} />)
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 shrink-0 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>

              {/* Notas del pedido */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>Notas del pedido</p>
                  <span className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>{observaciones.length}/{OBSERVACIONES_MAX}</span>
                </div>
                <Textarea
                  placeholder='Ej: "sin cebolla", "salsa aparte", "sin cubiertos"'
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value.slice(0, OBSERVACIONES_MAX))}
                  maxLength={OBSERVACIONES_MAX}
                  rows={2}
                  className="text-xs"
                />
              </div>

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
                  {/* Pagos digitales y con Bold — 2×2 */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {METODOS_PAGO_DIGITAL.map((m) => {
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
                  {/* Domicilio / Rappi — 2 columnas */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {CANALES_DESCUENTO_EMPLEADO.map((m) => {
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
                  {/* Crédito — ancho completo, estilo diferenciado */}
                  <button type="button"
                    onClick={() => { setMetodoPago('Crédito'); setValorRecibido(''); }}
                    className="w-full py-2.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: metodoPago === 'Crédito' ? 'oklch(0.65 0.18 50)' : 'oklch(0.97 0.04 60)',
                      color: metodoPago === 'Crédito' ? '#fff' : 'oklch(0.45 0.15 50)',
                      border: metodoPago === 'Crédito' ? '1px solid oklch(0.65 0.18 50)' : '1px solid oklch(0.85 0.08 60)',
                    }}>
                    Crédito
                  </button>
                  {metodoPago === 'Crédito' && (
                    <p className="text-xs px-1" style={{ color: 'var(--ink-muted)' }}>
                      Se creará una deuda pendiente y este valor no se suma a los ingresos.
                    </p>
                  )}
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

              {/* Descuento de empleado (solo Domicilio/Rappi) */}
              {esCanalConDescuento && (
                <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer" style={{ color: 'var(--ink-muted)' }}>
                    <input type="checkbox" checked={aplicaDescuento} onChange={(e) => setAplicaDescuento(e.target.checked)} />
                    Aplicar descuento de empleado
                  </label>
                  {aplicaDescuento && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap" style={{ color: 'var(--ink-muted)' }}>% Descuento</Label>
                        <Input
                          type="number" min="0" max="100" step="0.1" placeholder="0"
                          value={descuentoPorcentaje}
                          onChange={(e) => setDescuentoPorcentaje(e.target.value)}
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                      <Input
                        placeholder="Nombre del empleado"
                        value={descuentoEmpleado}
                        onChange={(e) => setDescuentoEmpleado(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Input
                        placeholder="Autorizado por"
                        value={autorizadoPor}
                        onChange={(e) => setAutorizadoPor(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
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
                {descuentoValor > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--ink-muted)' }}>Descuento empleado ({descuentoPorcentaje}%)</span>
                    <span style={{ color: 'var(--danger-text)' }}>-{formatCurrency(descuentoValor)}</span>
                  </div>
                )}
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

        <ComboCustomizeModal
          open={comboModalOpen}
          onOpenChange={setComboModalOpen}
          receta={comboModalReceta}
          initialComponentes={comboInitialComponentes}
          reservado={reservadoPorReceta(cart, comboEditingLineKey)}
          onConfirm={handleComboConfirm}
        />
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
                  <div key={d.id}>
                    <div className="flex justify-between text-sm">
                      <span>{d.receta?.nombre}</span>
                      <span style={{ color: 'var(--ink-muted)' }}>
                        {formatNum(d.cantidad)} × {formatCurrency(d.precio_unitario)} = <strong>{formatCurrency(d.subtotal)}</strong>
                      </span>
                    </div>
                    {d.componentes?.length > 0 && (
                      <ul className="mt-0.5 pl-3">
                        {d.componentes.map((c) => (
                          <li key={c.id} className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                            {c.grupo?.nombre}: {c.receta?.nombre}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {selected.observaciones && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--ink-muted)' }}>NOTAS DEL PEDIDO</p>
                <p className="text-sm">{selected.observaciones}</p>
              </div>
            )}
            {selected.estado === 'anulada' && (
              <div className="rounded-lg p-3" style={{ background: 'var(--danger-subtle)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--danger-text)' }}>VENTA ANULADA</p>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Por: {selected.anulado_por || '—'}{selected.anulado_en ? ` · ${new Date(selected.anulado_en).toLocaleString('es-CO')}` : ''}
                </p>
                {selected.motivo_anulacion && (
                  <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>Motivo: {selected.motivo_anulacion}</p>
                )}
              </div>
            )}
            <div className="pt-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
              {parseFloat(selected.descuento_aplicado) > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--ink-muted)' }}>Descuento empleado ({parseFloat(selected.descuento_porcentaje)}%):</span>
                    <span style={{ color: 'var(--danger-text)' }}>- {formatCurrency(selected.descuento_aplicado)}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Empleado: {selected.descuento_empleado || '—'} · Autorizó: {selected.autorizado_por || '—'}
                  </p>
                </>
              )}
              <div className="flex justify-end">
                <span className="font-semibold">Total: {formatCurrency(selected.total)}</span>
              </div>
            </div>
          </div>
        )}
      </FormModal>

      <FormModal
        open={anularOpen}
        onOpenChange={setAnularOpen}
        title={`Anular venta #${selected?.id}`}
        description="El stock de los productos vendidos se restaurará automáticamente y, si era una venta a crédito, se cancelará. Esta acción no se puede deshacer."
        onSubmit={doAnular}
        loading={anulando}
        submitLabel="Anular venta"
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="anuladoPor">¿Quién anula la venta? *</Label>
            <Input id="anuladoPor" className="mt-1" value={anuladoPorInput} onChange={(e) => setAnuladoPorInput(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="motivoAnulacion">Motivo <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(opcional)</span></Label>
            <Textarea id="motivoAnulacion" className="mt-1" rows={3} value={motivoInput} onChange={(e) => setMotivoInput(e.target.value)} />
          </div>
        </div>
      </FormModal>
    </>
  );
}
