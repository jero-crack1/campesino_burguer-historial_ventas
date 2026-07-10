import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, PlusCircle, MinusCircle, Search, X, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
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
import { formatNum, UNIDADES, cn } from '@/lib/utils';

const optNum = z.preprocess(
  v => (v === '' || v === null || v === undefined) ? null : Number(v),
  z.number().min(0).nullable(),
);

const ingredienteSchema = z.object({
  tipo: z.enum(['materia_prima', 'sub_receta']),
  materia_prima_id: z.coerce.number().optional().nullable(),
  sub_receta_ingrediente_id: z.coerce.number().optional().nullable(),
  cantidad: z.coerce.number()
    .min(0.01, 'Requerido')
    .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, 'Máximo 2 decimales'),
});

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  unidad_produccion: z.string().min(1, 'Unidad requerida'),
  cantidad_produccion: z.coerce.number().min(0.001, 'Requerido'),
  porciones: optNum,
  peso_porcion: optNum,
  costo_porcion: optNum,
  ingredientes: z.array(ingredienteSchema).min(1, 'Al menos un ingrediente'),
});

const STOCK_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'con', label: 'Con stock' },
  { value: 'sin', label: 'Sin stock' },
];

const blank = () => ({ tipo: 'materia_prima', materia_prima_id: '', sub_receta_ingrediente_id: '', cantidad: '' });

export default function SubRecetasPage() {
  const [items, setItems] = useState([]);
  const [mps, setMps] = useState([]);
  const [srs, setSrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [search, setSearch] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState('all');
  const [filtroStock, setFiltroStock] = useState('all');

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { ingredientes: [blank()] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredientes' });
  const ingredientesWatch = useWatch({ control, name: 'ingredientes' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m] = await Promise.all([api.get('/sub-recetas'), api.get('/materias-primas')]);
      setItems(s.data);
      setSrs(s.data);
      setMps(m.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unidadesEnUso = useMemo(
    () => ['all', ...[...new Set(items.map(i => i.unidad_produccion).filter(Boolean))].sort()],
    [items],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(item => {
      if (q && !item.nombre.toLowerCase().includes(q)) return false;
      if (filtroUnidad !== 'all' && item.unidad_produccion !== filtroUnidad) return false;
      if (filtroStock === 'con' && !(parseFloat(item.stock_actual) > 0)) return false;
      if (filtroStock === 'sin' && !(parseFloat(item.stock_actual) <= 0)) return false;
      return true;
    });
  }, [items, search, filtroUnidad, filtroStock]);

  const hasFilters = search.trim() !== '' || filtroUnidad !== 'all' || filtroStock !== 'all';
  const activeFilterCount = [search.trim() !== '', filtroUnidad !== 'all', filtroStock !== 'all'].filter(Boolean).length;
  const clearFilters = () => { setSearch(''); setFiltroUnidad('all'); setFiltroStock('all'); };

  const availableSrs = useMemo(
    () => (selected ? srs.filter(s => s.id !== selected.id) : srs),
    [srs, selected],
  );

  const openSearch = (i) => { setActiveSearchIndex(i); setSearchQuery(''); };
  const closeSearch = () => { setActiveSearchIndex(null); setSearchQuery(''); };

  const handleRemove = (i) => {
    if (activeSearchIndex === i) closeSearch();
    else if (activeSearchIndex !== null && activeSearchIndex > i) setActiveSearchIndex(prev => prev - 1);
    remove(i);
  };

  const openCreate = () => {
    setSelected(null);
    reset({ nombre: '', descripcion: '', unidad_produccion: '', cantidad_produccion: 1, porciones: '', peso_porcion: '', costo_porcion: '', ingredientes: [blank()] });
    closeSearch(); setError(''); setFormOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    reset({
      nombre: row.nombre,
      descripcion: row.descripcion || '',
      unidad_produccion: row.unidad_produccion,
      cantidad_produccion: row.cantidad_produccion,
      porciones: row.porciones ?? '',
      peso_porcion: row.peso_porcion ?? '',
      costo_porcion: row.costo_porcion ?? '',
      ingredientes: row.ingredientes?.map((i) => {
        const cantidad = parseFloat(Number(i.cantidad).toFixed(2));
        if (i.materia_prima_id) return { tipo: 'materia_prima', materia_prima_id: String(i.materia_prima_id), sub_receta_ingrediente_id: '', cantidad };
        return { tipo: 'sub_receta', materia_prima_id: '', sub_receta_ingrediente_id: String(i.sub_receta_ingrediente_id), cantidad };
      }) || [blank()],
    });
    closeSearch(); setError(''); setFormOpen(true);
  };

  const onSubmit = async (values) => {
    setSaving(true); setError('');
    try {
      const payload = {
        ...values,
        ingredientes: values.ingredientes.map(ing => ({
          materia_prima_id: ing.tipo === 'materia_prima' ? ing.materia_prima_id : null,
          sub_receta_ingrediente_id: ing.tipo === 'sub_receta' ? ing.sub_receta_ingrediente_id : null,
          cantidad: Number(ing.cantidad.toFixed(2)),
        })),
      };
      if (selected) {
        await api.put(`/sub-recetas/${selected.id}`, payload);
        toast.success(`"${values.nombre}" actualizada`);
      } else {
        await api.post('/sub-recetas', payload);
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
    } catch (e) { toast.error(e.message); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    {
      key: 'porciones', label: 'Porciones',
      render: (r) => {
        const porc = parseFloat(r.porciones);
        const peso = parseFloat(r.peso_porcion);
        if (!porc && !peso) return <span className="text-[var(--ink-faint)] text-xs">—</span>;
        return (
          <span className="text-xs leading-tight">
            <span className="font-medium">{formatNum(porc)}</span>
            {peso > 0 && <span className="text-[var(--ink-muted)]"> × {formatNum(peso)}{r.unidad_produccion}</span>}
          </span>
        );
      },
    },
    { key: 'cantidad_produccion', label: 'Rinde', render: (r) => `${formatNum(r.cantidad_produccion)} ${r.unidad_produccion}` },
    {
      key: 'costo_porcion', label: 'Costo/porción',
      render: (r) => r.costo_porcion
        ? <span className="font-medium text-[var(--ink)]">${parseFloat(r.costo_porcion).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
        : <span className="text-[var(--ink-faint)] text-xs">—</span>,
    },
    {
      key: 'stock_actual', label: 'Stock',
      render: (r) => {
        const s = parseFloat(r.stock_actual);
        return <Badge variant={s > 0 ? 'success' : 'danger'}>{formatNum(s)} {r.unidad_produccion}</Badge>;
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
      <PageHeader
        title="Sub Recetas"
        description="Fórmulas de producción intermedias"
        action={<Button onClick={openCreate}><Plus className="w-4 h-4" />Nueva sub receta</Button>}
      />

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
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {unidadesEnUso.map(u => (
              <SelectItem key={u} value={u}>{u === 'all' ? 'Todas las unidades' : u}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroStock} onValueChange={setFiltroStock}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
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

      <FormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? 'Editar sub receta' : 'Nueva sub receta'}
        onSubmit={handleSubmit(onSubmit)}
        loading={saving}
      >
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

          {/* Porción estándar */}
          <div>
            <Label>Porciones estándar</Label>
            <Input type="number" min="0" step="0.001" className="mt-1" placeholder="Ej: 21.5" {...register('porciones')} />
            <FieldError message={errors.porciones?.message} />
          </div>
          <div>
            <Label>Peso por porción</Label>
            <Input type="number" min="0" step="0.001" className="mt-1" placeholder="Ej: 20" {...register('peso_porcion')} />
            <FieldError message={errors.peso_porcion?.message} />
          </div>
          <div className="col-span-2">
            <Label>Costo por porción <span className="text-[var(--ink-faint)] font-normal text-xs">(opcional, se calcula del Excel)</span></Label>
            <Input type="number" min="0" step="0.01" className="mt-1" placeholder="Ej: 126.43" {...register('costo_porcion')} />
            <FieldError message={errors.costo_porcion?.message} />
          </div>

          <div className="col-span-2">
            <Label>Descripción</Label>
            <Textarea className="mt-1" rows={2} {...register('descripcion')} />
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Ingredientes *</Label>
            <Button type="button" size="sm" variant="ghost" onClick={() => append(blank())}>
              <PlusCircle className="w-3.5 h-3.5" /> Agregar
            </Button>
          </div>
          {errors.ingredientes && !Array.isArray(errors.ingredientes) && (
            <FieldError message={errors.ingredientes.message} />
          )}
          <div className="space-y-2">
            {fields.map((field, i) => {
              const tipo = ingredientesWatch?.[i]?.tipo || 'materia_prima';
              const mpId = ingredientesWatch?.[i]?.materia_prima_id;
              const srId = ingredientesWatch?.[i]?.sub_receta_ingrediente_id;

              return (
                <div key={field.id} className="grid grid-cols-[72px_1fr_90px_32px] gap-2 items-start">
                  {/* Tipo: MP o SubRec */}
                  <Select
                    defaultValue={field.tipo || 'materia_prima'}
                    onValueChange={(v) => {
                      setValue(`ingredientes.${i}.tipo`, v);
                      setValue(`ingredientes.${i}.materia_prima_id`, '');
                      setValue(`ingredientes.${i}.sub_receta_ingrediente_id`, '');
                      closeSearch();
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="materia_prima">MP</SelectItem>
                      <SelectItem value="sub_receta">SubRec</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Selector de MP o SubReceta con búsqueda */}
                  <div>
                    {tipo === 'materia_prima' ? (
                      activeSearchIndex === i ? (
                        <div>
                          <div className="flex items-center gap-1.5 h-8 rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--surface)] px-2">
                            <Search className="h-3.5 w-3.5 text-[var(--ink-faint)] shrink-0" />
                            <input
                              autoFocus
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              onKeyDown={e => e.key === 'Escape' && closeSearch()}
                              placeholder="Buscar materia prima…"
                              className="flex-1 text-xs outline-none bg-transparent text-[var(--ink)] placeholder:text-[var(--ink-faint)]"
                            />
                            <button type="button" onClick={closeSearch} className="text-[var(--ink-faint)] hover:text-[var(--ink)]">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="mt-1 max-h-44 overflow-y-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                            {mps.filter(m => !searchQuery || m.nombre.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                              <p className="py-2 text-center text-xs text-[var(--ink-faint)]">Sin resultados</p>
                            ) : mps
                                .filter(m => !searchQuery || m.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map(m => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    className={cn(
                                      'flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors',
                                      String(m.id) === String(mpId) && 'bg-[var(--surface-2)]',
                                    )}
                                    onClick={() => { setValue(`ingredientes.${i}.materia_prima_id`, String(m.id)); closeSearch(); }}
                                  >
                                    <Check className={cn('h-3.5 w-3.5 text-[var(--accent)] shrink-0', String(m.id) !== String(mpId) && 'opacity-0')} />
                                    <span className="truncate flex-1">{m.nombre}</span>
                                    <span className="text-[var(--ink-muted)] shrink-0">{m.unidad_medida}</span>
                                  </button>
                                ))
                            }
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openSearch(i)}
                          className={cn(
                            'flex h-8 w-full items-center justify-between gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 text-xs transition-colors text-left',
                            'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]',
                            mpId ? 'text-[var(--ink)]' : 'text-[var(--ink-faint)]',
                          )}
                        >
                          <span className="truncate">
                            {mpId ? (mps.find(m => String(m.id) === String(mpId))?.nombre ?? 'Materia prima…') : 'Materia prima…'}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                        </button>
                      )
                    ) : (
                      activeSearchIndex === i ? (
                        <div>
                          <div className="flex items-center gap-1.5 h-8 rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--surface)] px-2">
                            <Search className="h-3.5 w-3.5 text-[var(--ink-faint)] shrink-0" />
                            <input
                              autoFocus
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              onKeyDown={e => e.key === 'Escape' && closeSearch()}
                              placeholder="Buscar sub receta…"
                              className="flex-1 text-xs outline-none bg-transparent text-[var(--ink)] placeholder:text-[var(--ink-faint)]"
                            />
                            <button type="button" onClick={closeSearch} className="text-[var(--ink-faint)] hover:text-[var(--ink)]">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="mt-1 max-h-44 overflow-y-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                            {availableSrs.filter(s => !searchQuery || s.nombre.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                              <p className="py-2 text-center text-xs text-[var(--ink-faint)]">Sin resultados</p>
                            ) : availableSrs
                                .filter(s => !searchQuery || s.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map(s => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    className={cn(
                                      'flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors',
                                      String(s.id) === String(srId) && 'bg-[var(--surface-2)]',
                                    )}
                                    onClick={() => { setValue(`ingredientes.${i}.sub_receta_ingrediente_id`, String(s.id)); closeSearch(); }}
                                  >
                                    <Check className={cn('h-3.5 w-3.5 text-[var(--accent)] shrink-0', String(s.id) !== String(srId) && 'opacity-0')} />
                                    <span className="truncate">{s.nombre}</span>
                                  </button>
                                ))
                            }
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openSearch(i)}
                          className={cn(
                            'flex h-8 w-full items-center justify-between gap-1 rounded-[var(--radius)] border border-[var(--accent-subtle,var(--border))] bg-[var(--surface)] px-3 text-xs transition-colors text-left',
                            'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]',
                            srId ? 'text-[var(--ink)]' : 'text-[var(--ink-faint)]',
                          )}
                        >
                          <span className="truncate">
                            {srId ? (availableSrs.find(s => String(s.id) === String(srId))?.nombre ?? 'Sub receta…') : 'Sub receta…'}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                        </button>
                      )
                    )}
                    <FieldError message={errors.ingredientes?.[i]?.materia_prima_id?.message || errors.ingredientes?.[i]?.sub_receta_ingrediente_id?.message} />
                  </div>

                  {/* Cantidad */}
                  <div>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="h-8 text-xs"
                      placeholder="Cant."
                      {...register(`ingredientes.${i}.cantidad`)}
                    />
                    <FieldError message={errors.ingredientes?.[i]?.cantidad?.message} />
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-[var(--danger)]"
                    onClick={() => handleRemove(i)}
                    disabled={fields.length === 1}
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
        {error && <p className="text-sm text-[var(--danger-text)] mt-2">{error}</p>}
      </FormModal>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar sub receta"
        description={`¿Estás seguro de eliminar "${selected?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={onDelete}
        loading={deleting}
      />
    </>
  );
}
