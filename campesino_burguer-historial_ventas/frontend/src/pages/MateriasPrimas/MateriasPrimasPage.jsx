import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, X, SlidersHorizontal } from 'lucide-react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import StockBadge from '@/components/StockBadge';
import FieldError from '@/components/FieldError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UNIDADES, formatCOP } from '@/lib/utils';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  unidad_medida: z.string().min(1, 'Unidad requerida'),
  stock_minimo: z.coerce.number().min(0).default(0),
  costo_paquete: z.coerce.number().min(0).default(0),
  cantidad_paquete: z.coerce.number().min(0).default(0),
});

const STOCK_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'ok', label: 'Stock OK' },
  { value: 'bajo', label: 'Stock bajo' },
  { value: 'sin', label: 'Sin stock' },
];

export default function MateriasPrimasPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState('all');
  const [filtroStock, setFiltroStock] = useState('all');

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const costoPaquete = useWatch({ control, name: 'costo_paquete', defaultValue: 0 });
  const cantidadPaquete = useWatch({ control, name: 'cantidad_paquete', defaultValue: 0 });
  const costoUnitario = costoPaquete > 0 && cantidadPaquete > 0
    ? costoPaquete / cantidadPaquete
    : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/materias-primas');
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unidadesEnUso = useMemo(
    () => ['all', ...[...new Set(items.map(i => i.unidad_medida).filter(Boolean))].sort()],
    [items]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(item => {
      if (q && !item.nombre.toLowerCase().includes(q)) return false;
      if (filtroUnidad !== 'all' && item.unidad_medida !== filtroUnidad) return false;
      if (filtroStock === 'ok' && !(item.stock_actual > item.stock_minimo)) return false;
      if (filtroStock === 'bajo' && !(item.stock_actual > 0 && item.stock_actual <= item.stock_minimo)) return false;
      if (filtroStock === 'sin' && !(item.stock_actual <= 0)) return false;
      return true;
    });
  }, [items, search, filtroUnidad, filtroStock]);

  const hasFilters = search.trim() !== '' || filtroUnidad !== 'all' || filtroStock !== 'all';
  const activeFilterCount = [
    search.trim() !== '',
    filtroUnidad !== 'all',
    filtroStock !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch('');
    setFiltroUnidad('all');
    setFiltroStock('all');
  };

  const openCreate = () => { setSelected(null); reset({ costo_paquete: 0, cantidad_paquete: 0, stock_minimo: 0 }); setError(''); setFormOpen(true); };
  const openEdit = (row) => { setSelected(row); reset({ ...row, stock_minimo: row.stock_minimo, costo_paquete: row.costo_paquete ?? 0, cantidad_paquete: row.cantidad_paquete ?? 0 }); setError(''); setFormOpen(true); };
  const openDelete = (row) => { setSelected(row); setConfirmOpen(true); };

  const onSubmit = async (values) => {
    setSaving(true);
    setError('');
    try {
      if (selected) {
        await api.put(`/materias-primas/${selected.id}`, values);
        toast.success(`"${values.nombre}" actualizada`);
      } else {
        await api.post('/materias-primas', values);
        toast.success(`"${values.nombre}" creada`);
      }
      setFormOpen(false);
      load();
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/materias-primas/${selected.id}`);
      setConfirmOpen(false);
      toast.success(`"${selected.nombre}" eliminada`);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'unidad_medida', label: 'Unidad' },
    { key: 'stock', label: 'Stock', render: (r) => <StockBadge stock={r.stock_actual} minimo={r.stock_minimo} unidad={r.unidad_medida} /> },
    { key: 'precio_unitario', label: 'Costo / unidad', render: (r) => r.precio_unitario > 0 ? formatCOP(r.precio_unitario) : '—' },
    {
      key: 'actions', label: '', width: 100,
      render: (r) => (
        <span className="flex items-center gap-1 justify-end">
          <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant="ghost" onClick={() => openDelete(r)} className="text-[var(--danger)] hover:text-[var(--danger)]"><Trash2 className="w-3.5 h-3.5" /></Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Materias Primas"
        description="Gestión de insumos y materiales de producción"
        action={<Button onClick={openCreate}><Plus className="w-4 h-4" />Nueva materia prima</Button>}
      />

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 animate-fade-in">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)] pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-[var(--ink-muted)] transition-colors duration-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Unidad de medida */}
        <Select value={filtroUnidad} onValueChange={setFiltroUnidad}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {unidadesEnUso.map(u => (
              <SelectItem key={u} value={u}>
                {u === 'all' ? 'Todas las unidades' : u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Estado de stock */}
        <Select value={filtroStock} onValueChange={setFiltroStock}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STOCK_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Limpiar filtros */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 animate-fade-in">
            <X className="w-3.5 h-3.5" />
            Limpiar
            {activeFilterCount > 1 && (
              <Badge variant="secondary" className="ml-0.5 px-1.5 py-0 text-[10px] h-4">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}

        {/* Contador de resultados */}
        {hasFilters && !loading && (
          <span className="ml-auto text-xs text-[var(--ink-muted)] animate-fade-in">
            {filtered.length === items.length
              ? `${items.length} resultados`
              : `${filtered.length} de ${items.length}`}
          </span>
        )}

        {/* Icono decorativo de filtros activos */}
        {hasFilters && (
          <SlidersHorizontal className="w-4 h-4 text-[var(--accent)] animate-fade-in" />
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyTitle={hasFilters ? 'Sin resultados' : 'Sin materias primas'}
        emptyDescription={
          hasFilters
            ? 'Ninguna materia prima coincide con los filtros aplicados.'
            : 'Registra tu primer insumo para comenzar.'
        }
      />

      <FormModal open={formOpen} onOpenChange={setFormOpen} title={selected ? 'Editar materia prima' : 'Nueva materia prima'} onSubmit={handleSubmit(onSubmit)} loading={saving}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Nombre *</Label>
            <Input className="mt-1" placeholder="Ej: BBQ, Harina de trigo" {...register('nombre')} />
            <FieldError message={errors.nombre?.message} />
          </div>
          <div>
            <Label>Unidad de medida *</Label>
            <Controller name="unidad_medida" control={control} render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            <FieldError message={errors.unidad_medida?.message} />
          </div>
          <div>
            <Label>Stock mínimo</Label>
            <Input type="number" min="0" step="0.001" className="mt-1" {...register('stock_minimo')} />
            <FieldError message={errors.stock_minimo?.message} />
          </div>

          <div className="col-span-2 border-t border-[var(--border)] pt-3 mt-1">
            <p className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-3">Precio del paquete</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Costo del paquete (COP)</Label>
                <Input type="number" min="0" step="1" className="mt-1" placeholder="Ej: 36820" {...register('costo_paquete')} />
                <FieldError message={errors.costo_paquete?.message} />
              </div>
              <div>
                <Label>Cantidad del paquete</Label>
                <Input type="number" min="0" step="0.001" className="mt-1" placeholder="Ej: 4000" {...register('cantidad_paquete')} />
                <FieldError message={errors.cantidad_paquete?.message} />
              </div>
            </div>
            {costoUnitario !== null && (
              <div className="mt-3 flex items-center gap-2 bg-[var(--surface-raised)] rounded-md px-3 py-2">
                <span className="text-xs text-[var(--ink-muted)]">Costo unitario calculado:</span>
                <span className="text-sm font-semibold text-[var(--accent)]">{formatCOP(costoUnitario)}</span>
                <span className="text-xs text-[var(--ink-muted)]">por unidad</span>
              </div>
            )}
          </div>

          <div className="col-span-2">
            <Label>Descripción</Label>
            <Textarea className="mt-1" placeholder="Notas adicionales…" {...register('descripcion')} />
          </div>
        </div>
        {error && <p className="text-sm text-[var(--danger-text)] mt-3">{error}</p>}
      </FormModal>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar materia prima"
        description={`¿Estás seguro de eliminar "${selected?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={onDelete}
        loading={deleting}
      />
    </>
  );
}
