import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCOP, formatDate, estadoPromocion } from '@/lib/utils';

const ESTADO_LABEL = { vigente: 'Vigente', programada: 'Programada', expirada: 'Expirada' };
const ESTADO_VARIANT = { vigente: 'default', programada: 'secondary', expirada: 'secondary' };

export default function PromocionesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quitandoId, setQuitandoId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/recetas');
      setItems(data.filter((r) => r.en_promocion));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const quitarPromocion = async (row) => {
    setQuitandoId(row.id);
    try {
      await api.put(`/recetas/${row.id}`, {
        nombre: row.nombre,
        descripcion: row.descripcion,
        unidad_produccion: row.unidad_produccion,
        cantidad_produccion: row.cantidad_produccion,
        precio_venta: row.precio_venta,
        costo_produccion: row.costo_produccion,
        imagen_url: row.imagen_url,
        categoria: row.categoria,
        es_combo: row.es_combo,
        en_promocion: false,
      });
      toast.success(`Promoción quitada de "${row.nombre}"`);
      await load();
    } catch (e) {
      toast.error(`Error al quitar la promoción: ${e.message}`);
    } finally {
      setQuitandoId(null);
    }
  };

  const columns = [
    {
      key: 'nombre', label: 'Producto',
      render: (r) => (
        <div className="flex items-center gap-2 min-w-0">
          {r.imagen_url && (
            <img src={r.imagen_url} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />
          )}
          <span className="font-medium truncate">{r.nombre}</span>
        </div>
      ),
    },
    { key: 'precio_venta', label: 'Precio normal', render: (r) => <span className="line-through" style={{ color: 'var(--ink-faint)' }}>{formatCOP(r.precio_venta)}</span> },
    { key: 'precio_promocion', label: 'Precio promo', render: (r) => <span className="font-semibold" style={{ color: 'var(--danger-text)' }}>{formatCOP(r.precio_promocion)}</span> },
    {
      key: 'descuento', label: '% Desc.',
      render: (r) => {
        const pv = parseFloat(r.precio_venta), pp = parseFloat(r.precio_promocion);
        if (!(pv > 0)) return '—';
        return `${(((pv - pp) / pv) * 100).toFixed(0)}%`;
      },
    },
    {
      key: 'estado', label: 'Vigencia',
      render: (r) => {
        const estado = estadoPromocion(r);
        return <Badge variant={ESTADO_VARIANT[estado]}>{ESTADO_LABEL[estado]}</Badge>;
      },
    },
    { key: 'promocion_desde', label: 'Desde', render: (r) => r.promocion_desde ? formatDate(r.promocion_desde) : <span style={{ color: 'var(--ink-faint)' }}>Sin límite</span> },
    { key: 'promocion_hasta', label: 'Hasta', render: (r) => r.promocion_hasta ? formatDate(r.promocion_hasta) : <span style={{ color: 'var(--ink-faint)' }}>Sin límite</span> },
    {
      key: 'actions', label: '', width: 160,
      render: (r) => (
        <span className="flex items-center gap-1 justify-end">
          <Button size="sm" variant="ghost" onClick={() => navigate('/recetas')}>Editar</Button>
          <Button size="sm" variant="ghost" className="text-[var(--danger)]" onClick={() => quitarPromocion(r)} disabled={quitandoId === r.id}>
            <X className="w-3.5 h-3.5" /> Quitar
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Promociones"
        description="Productos con precio especial, activos en el catálogo de Ventas"
        action={<Button onClick={() => navigate('/recetas')}><Plus className="w-4 h-4" />Nueva promoción</Button>}
      />
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyTitle="Sin promociones"
        emptyDescription="Marca una receta como 'En promoción' desde Recetas para que aparezca aquí."
      />
    </>
  );
}
