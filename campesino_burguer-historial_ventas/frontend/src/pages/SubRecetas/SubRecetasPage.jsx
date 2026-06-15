import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, PlusCircle, MinusCircle, Search, X, SlidersHorizontal } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import FieldError from '@/components/FieldError';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNum, UNIDADES } from '@/lib/utils';

const ingredienteSchema = z.object({
  materia_prima_id: z.coerce.number().min(1, 'Requerido'),
  cantidad: z.coerce.number().min(0.001, 'Requerido'),
});

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  unidad_produccion: z.string().min(1, 'Unidad requerida'),
  cantidad_produccion: z.coerce.number().min(0.001, 'Requerido'),
  ingredientes: z.array(ingredienteSchema).min(1, 'Al menos un ingrediente'),
});

const STOCK_OPTIONS = [
  { value: 'all',  label: 'Todos los estados' },
  { value: 'con',  label: 'Con stock' },
  { value: 'sin',  label: 'Sin stock' },
];

export default function SubRecetasPage() {
  const [items, setItems] = useState([]);
  const [mps, setMps] = useState([]);
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

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { ingredientes: [{ materia_prima_id: '', cantidad: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredientes' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m] = await Promise.all([api.get('/sub-recetas'), api.get('/materias-primas')]);
      setItems(s.data); setMps(m.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unidadesEnUso = useMemo(
    () => ['all', ...[...new Set(items.map(i => i.unidad_produccion).filter(Boolean))].sort()],
    [items]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(item => {
      if (q && !item.nombre.toLowerCase().includes(q)) return false;
      if (filtroUnidad !== 'all' && item.unidad_produccion !== filtroUnidad) return false;
      if (filtroStock === 'con' && !(item.stock_actual > 0)) return false;
      if (filtroStock === 'sin' && !(item.stock_actual <= 0)) return false;
      return true;
    });
  }, [items, search, filtroUnidad, filtroStock]);

  const hasFilters = search.trim() !== '' || filtroUnidad !== 'all' || filtroStock !== 'all';
  const activeFilterCount = [search.trim() !== '', filtroUnidad !== 'all', filtroStock !== 'all'].filter(Boolean).length;

  const clearFilters = () => { setSearch(''); setFiltroUnidad('all'); setFiltroStock('all'); };

  const openCreate = () => {
    setSelected(null);
    reset({ nombre: '', descripcion: '', unidad_produccion: '', cantidad_produccion: 1, ingredientes: [{ materia_prima_id: '', cantidad: '' }] });
    setError(''); setFormOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    reset({
      nombre: row.nombre, descripcion: row.descripcion || '', unidad_produccion: row.unidad_produccion,
      cantidad_produccion: row.cantidad_produccion,
      ingredientes: row.ingredientes?.map((i) => ({ materia_prima_id: String(i.materia_prima_id), cantidad: i.cantidad })) || [],
    });
    setError(''); setFormOpen(true);
  };

  const onSubmit = async (values) => {
    setSaving(true); setError('');
    try {
      if (selected) {
        await api.put(`/sub-recetas/${selected.id}`, values);
        toast.success(`"${values.nombre}" actualizada`);
      } else {
        await api.post('/sub-recetas', values);
        toast.success(`"${values.nombre}" creada`);
      }
      setFormOpen(false); load();
    } catch (e) { setError(e.message); toast.error(e.message); }
    finally { setSaving(false); }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/sub-recetas/${selected.id}`);
      setConfirmOpen(false);
      toast.success(`"${selected.nombre}" eliminada`);
      load();
    }
    catch (e) { toast.error(e.message); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'cantidad_produccion', label: 'Rinde', render: (r) => `${formatNum(r.cantidad_produccion)} ${r.unidad_produccion}` },
    { key: 'ingredientes', label: 'Ingredientes', render: (r) => <Badge variant="secondary">{r.ingredientes?.length || 0}</Badge> },
    {
      key: 'stock_actual', label: 'Stock',
      render: (r) => {
        const s = parseFloat(r.stock_actual);
        const variant = s > 0 ? 'success' : 'danger';
        return <Badge variant={variant}>{formatNum(s)} {r.unidad_produccion}</Badge>;
      },
    },
    {
      key: 'actions', label: '', width: 100,
      render: (r) => (
        <span className="flex items-center gap-1 justify-end">
          <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant="ghost" onClick={() => { setSelected(r); setConfirmOpen(true); }} className="text-[var(--danger)]"><Trash2 className="w-3.5 h-3.5" /></Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Sub Recetas" description="Fórmulas de producción intermedias" action={<Button onClick={openCreate}><Plus className="w-4 h-4" />Nueva sub receta</Button>} />

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 animate-fade-in">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)] pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Buscar sub receta…"
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

        <Select value={filtroUnidad} onValueChange={setFiltroUnidad}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {unidadesEnUso.map(u => (
              <SelectItem key={u} value={u}>{u === 'all' ? 'Todas las unidades' : u}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 animate-fade-in">
            <X className="w-3.5 h-3.5" />
            Limpiar
            {activeFilterCount > 1 && (
              <Badge variant="secondary" className="ml-0.5 px-1.5 py-0 text-[10px] h-4">{activeFilterCount}</Badge>
            )}
          </Button>
        )}

        {hasFilters && !loading && (
          <span className="ml-auto text-xs text-[var(--ink-muted)] animate-fade-in">
            {filtered.length === items.length ? `${items.length} resultados` : `${filtered.length} de ${items.length}`}
          </span>
        )}

        {hasFilters && <SlidersHorizontal className="w-4 h-4 text-[var(--accent)] animate-fade-in" />}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyTitle={hasFilters ? 'Sin resultados' : 'Sin sub recetas'}
        emptyDescription={hasFilters ? 'Ninguna sub receta coincide con los filtros.' : 'Crea tu primera fórmula intermedia.'}
      />

      <FormModal open={formOpen} onOpenChange={setFormOpen} title={selected ? 'Editar sub receta' : 'Nueva sub receta'} onSubmit={handleSubmit(onSubmit)} loading={saving}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Nombre *</Label>
            <Input className="mt-1" {...register('nombre')} />
            <FieldError message={errors.nombre?.message} />
          </div>
          <div>
            <Label>Unidad de producción *</Label>
            <Controller name="unidad_produccion" control={control} render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            <FieldError message={errors.unidad_produccion?.message} />
          </div>
          <div>
            <Label>Cantidad que produce *</Label>
            <Input type="number" min="0.001" step="0.001" className="mt-1" {...register('cantidad_produccion')} />
            <FieldError message={errors.cantidad_produccion?.message} />
          </div>
          <div className="col-span-2">
            <Label>Descripción</Label>
            <Textarea className="mt-1" rows={2} {...register('descripcion')} />
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Ingredientes *</Label>
            <Button type="button" size="sm" variant="ghost" onClick={() => append({ materia_prima_id: '', cantidad: '' })}>
              <PlusCircle className="w-3.5 h-3.5" /> Agregar
            </Button>
          </div>
          {errors.ingredientes && !Array.isArray(errors.ingredientes) && <FieldError message={errors.ingredientes.message} />}
          <div className="space-y-2">
            {fields.map((field, i) => (
              <div key={field.id} className="grid grid-cols-[1fr_90px_32px] gap-2 items-start">
                <div>
                  <Select onValueChange={(v) => setValue(`ingredientes.${i}.materia_prima_id`, v)} defaultValue={field.materia_prima_id ? String(field.materia_prima_id) : undefined}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Materia prima" /></SelectTrigger>
                    <SelectContent>{mps.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.nombre} ({m.unidad_medida})</SelectItem>)}</SelectContent>
                  </Select>
                  <FieldError message={errors.ingredientes?.[i]?.materia_prima_id?.message} />
                </div>
                <div>
                  <Input type="number" min="0.001" step="0.001" className="h-8 text-xs" placeholder="Cant." {...register(`ingredientes.${i}.cantidad`)} />
                  <FieldError message={errors.ingredientes?.[i]?.cantidad?.message} />
                </div>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-[var(--danger)]" onClick={() => remove(i)} disabled={fields.length === 1}>
                  <MinusCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-[var(--danger-text)] mt-2">{error}</p>}
      </FormModal>

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Eliminar sub receta" description={`¿Estás seguro de eliminar "${selected?.nombre}"? Esta acción no se puede deshacer.`} onConfirm={onDelete} loading={deleting} />
    </>
  );
}
