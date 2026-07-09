import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, PlusCircle, MinusCircle, Search, X, ChevronDown, Check } from 'lucide-react';
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

const ingSchema = z.object({
  tipo: z.enum(['materia_prima', 'sub_receta']),
  materia_prima_id: z.union([z.coerce.number(), z.literal(''), z.null()]).optional(),
  sub_receta_id: z.union([z.coerce.number(), z.literal(''), z.null()]).optional(),
  cantidad: z.union([z.coerce.number(), z.literal('')]),
});

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  unidad_produccion: z.string().min(1, 'Requerido'),
  cantidad_produccion: z.coerce.number().min(0.001, 'Requerido'),
  precio_venta: z.coerce.number().min(0, 'Requerido'),
  costo_produccion: z.coerce.number().min(0, 'Requerido'),
  costo_objetivo: z.coerce.number().min(0).max(100).optional().nullable().or(z.literal('')),
  imagen_url: z.string().url('URL no válida').optional().or(z.literal('')),
  categoria: z.string().optional(),
  ingredientes: z.array(ingSchema).optional().default([]),
});

function ImageUrlField({ register, errors, control }) {
  const url = useWatch({ control, name: 'imagen_url' });
  const [status, setStatus] = useState('idle'); // idle | ok | error

  useEffect(() => {
    setStatus('idle');
    if (!url) return;
    const timer = setTimeout(() => setStatus('loading'), 0);
    return () => clearTimeout(timer);
  }, [url]);

  return (
    <div className="mt-1 space-y-2">
      <Input
        placeholder="https://i.imgur.com/... o https://images.unsplash.com/..."
        {...register('imagen_url')}
        onChange={(e) => {
          register('imagen_url').onChange(e);
          setStatus('idle');
        }}
      />
      <FieldError message={errors.imagen_url?.message} />
      {url && (
        <div className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <img
              src={url}
              alt="preview"
              className="w-full h-full object-cover"
              onLoad={() => setStatus('ok')}
              onError={() => setStatus('error')}
            />
          </div>
          <div className="text-xs pt-1">
            {status === 'ok' && <p style={{ color: 'var(--success-text)' }}>✓ La imagen carga correctamente</p>}
            {status === 'error' && (
              <>
                <p style={{ color: 'var(--danger-text)' }}>✗ Esta URL no muestra imagen</p>
                <p className="mt-1" style={{ color: 'var(--ink-muted)' }}>Usa una URL de Imgur, Unsplash o Cloudinary</p>
              </>
            )}
            {status === 'idle' && <p style={{ color: 'var(--ink-muted)' }}>Verificando…</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecetasPage() {
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

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { ingredientes: [{ tipo: 'materia_prima', materia_prima_id: '', sub_receta_id: '', cantidad: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredientes' });
  const ingredientes = useWatch({ control, name: 'ingredientes' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, m, s] = await Promise.all([api.get('/recetas'), api.get('/materias-primas'), api.get('/sub-recetas')]);
      setItems(r.data); setMps(m.data); setSrs(s.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const blank = () => ({ tipo: 'materia_prima', materia_prima_id: '', sub_receta_id: '', cantidad: '' });

  const openSearch = (i) => { setActiveSearchIndex(i); setSearchQuery(''); };
  const closeSearch = () => { setActiveSearchIndex(null); setSearchQuery(''); };

  const handleRemove = (i) => {
    if (activeSearchIndex === i) closeSearch();
    else if (activeSearchIndex !== null && activeSearchIndex > i) setActiveSearchIndex(prev => prev - 1);
    remove(i);
  };

  const openCreate = () => { setSelected(null); reset({ nombre: '', descripcion: '', unidad_produccion: '', cantidad_produccion: 1, precio_venta: 0, costo_produccion: 0, costo_objetivo: '', imagen_url: '', categoria: '', ingredientes: [blank()] }); closeSearch(); setError(''); setFormOpen(true); };

  const openEdit = (row) => {
    setSelected(row);
    reset({
      nombre: row.nombre, descripcion: row.descripcion || '', unidad_produccion: row.unidad_produccion, cantidad_produccion: row.cantidad_produccion,
      precio_venta: row.precio_venta || 0, costo_produccion: row.costo_produccion || 0, costo_objetivo: row.costo_objetivo ?? '', imagen_url: row.imagen_url || '', categoria: row.categoria || '',
      ingredientes: row.ingredientes?.map((i) => ({ tipo: i.tipo, materia_prima_id: i.materia_prima_id ? String(i.materia_prima_id) : '', sub_receta_id: i.sub_receta_id ? String(i.sub_receta_id) : '', cantidad: i.cantidad })) || [blank()],
    });
    closeSearch(); setError(''); setFormOpen(true);
  };

  const onSubmit = async (values) => {
    setSaving(true); setError('');
    try {
      const payload = { ...values };

      // Limpiar campos vacíos opcionales
      if (!payload.imagen_url) delete payload.imagen_url;
      if (!payload.categoria) delete payload.categoria;

      // Filtrar solo ingredientes válidos (con cantidad y materia/subreceta seleccionada)
      const ingsValidos = (payload.ingredientes || []).filter((i) => {
        const qty = parseFloat(i.cantidad);
        const tieneId = i.tipo === 'materia_prima'
          ? i.materia_prima_id && i.materia_prima_id !== ''
          : i.sub_receta_id && i.sub_receta_id !== '';
        return qty > 0 && tieneId;
      }).map((i) => ({
        tipo: i.tipo,
        materia_prima_id: i.tipo === 'materia_prima' ? Number(i.materia_prima_id) : null,
        sub_receta_id: i.tipo === 'sub_receta' ? Number(i.sub_receta_id) : null,
        cantidad: parseFloat(i.cantidad),
      }));

      if (!selected && ingsValidos.length === 0) {
        setError('Agrega al menos un ingrediente válido');
        toast.error('Agrega al menos un ingrediente válido');
        setSaving(false);
        return;
      }

      if (ingsValidos.length > 0) {
        payload.ingredientes = ingsValidos;
      } else {
        delete payload.ingredientes;
      }

      if (selected) {
        await api.put(`/recetas/${selected.id}`, payload);
        toast.success(`"${values.nombre}" actualizada correctamente`);
      } else {
        await api.post('/recetas', payload);
        toast.success(`"${values.nombre}" creada correctamente`);
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setError(e.message);
      toast.error(`Error al guardar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/recetas/${selected.id}`);
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
    { key: 'precio_venta', label: 'Precio venta', render: (r) => `$${parseFloat(r.precio_venta || 0).toLocaleString('es-CO')}` },
    { key: 'ingredientes', label: 'Ingredientes', render: (r) => <Badge variant="secondary">{r.ingredientes?.length || 0}</Badge> },
    { key: 'stock_actual', label: 'Stock', render: (r) => `${formatNum(r.stock_actual)} ${r.unidad_produccion}` },
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
      <PageHeader title="Recetas" description="Fórmulas de producto final" action={<Button onClick={openCreate}><Plus className="w-4 h-4" />Nueva receta</Button>} />
      <DataTable columns={columns} data={items} loading={loading} emptyTitle="Sin recetas" emptyDescription="Crea tu primera receta de producto final." />

      <FormModal open={formOpen} onOpenChange={setFormOpen} title={selected ? 'Editar receta' : 'Nueva receta'} onSubmit={handleSubmit(onSubmit)} loading={saving}>
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
          <div>
            <Label>Precio de venta *</Label>
            <Input type="number" min="0" step="0.01" className="mt-1" {...register('precio_venta')} />
            <FieldError message={errors.precio_venta?.message} />
          </div>
          <div>
            <Label>Costo de producción *</Label>
            <Input type="number" min="0" step="0.01" className="mt-1" {...register('costo_produccion')} />
            <FieldError message={errors.costo_produccion?.message} />
          </div>
          <div>
            <Label>% Costo objetivo <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(opcional)</span></Label>
            <div className="relative mt-1">
              <Input type="number" min="0" max="100" step="0.01" className="pr-8" placeholder="Ej: 35" {...register('costo_objetivo')} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: 'var(--ink-muted)' }}>%</span>
            </div>
            <FieldError message={errors.costo_objetivo?.message} />
          </div>
          <div className="col-span-2">
            <Label>Descripción</Label>
            <Textarea className="mt-1" rows={2} {...register('descripcion')} />
          </div>
          <div className="col-span-2">
            <Label>URL de imagen <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(opcional)</span></Label>
            <ImageUrlField register={register} errors={errors} control={control} />
          </div>
          <div className="col-span-2">
            <Label>Categoría <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(opcional)</span></Label>
            <Controller name="categoria" control={control} render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona categoría…" /></SelectTrigger>
                <SelectContent>
                  {['Entradas','Burgers','Patacón','Salchipapas','Mazorcada','Perros Calientes','Parrilla','Pizza','Adicionales','Bebidas','Sodas'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Ingredientes *</Label>
            <Button type="button" size="sm" variant="ghost" onClick={() => append(blank())}>
              <PlusCircle className="w-3.5 h-3.5" /> Agregar
            </Button>
          </div>
          <div className="space-y-2">
            {fields.map((field, i) => {
              const tipo = ingredientes?.[i]?.tipo || 'materia_prima';
              const mpId = ingredientes?.[i]?.materia_prima_id;
              const srId = ingredientes?.[i]?.sub_receta_id;
              return (
                <div key={field.id} className="grid grid-cols-[80px_1fr_80px_32px] gap-2 items-start">
                  <Select
                    defaultValue={field.tipo}
                    onValueChange={(v) => {
                      setValue(`ingredientes.${i}.tipo`, v);
                      setValue(`ingredientes.${i}.materia_prima_id`, '');
                      setValue(`ingredientes.${i}.sub_receta_id`, '');
                      closeSearch();
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="materia_prima">MP</SelectItem>
                      <SelectItem value="sub_receta">SubRec</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Selector con búsqueda inline */}
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
                            {srs.filter(s => !searchQuery || s.nombre.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                              <p className="py-2 text-center text-xs text-[var(--ink-faint)]">Sin resultados</p>
                            ) : srs
                                .filter(s => !searchQuery || s.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map(s => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    className={cn(
                                      'flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors',
                                      String(s.id) === String(srId) && 'bg-[var(--surface-2)]',
                                    )}
                                    onClick={() => {
                                      setValue(`ingredientes.${i}.sub_receta_id`, String(s.id));
                                      if (s.peso_porcion) setValue(`ingredientes.${i}.cantidad`, parseFloat(s.peso_porcion));
                                      closeSearch();
                                    }}
                                  >
                                    <Check className={cn('h-3.5 w-3.5 text-[var(--accent)] shrink-0', String(s.id) !== String(srId) && 'opacity-0')} />
                                    <span className="truncate flex-1">{s.nombre}</span>
                                    {s.peso_porcion && (
                                      <span className="text-[var(--ink-muted)] shrink-0">{formatNum(s.peso_porcion)}{s.unidad_produccion}/porc</span>
                                    )}
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
                            srId ? 'text-[var(--ink)]' : 'text-[var(--ink-faint)]',
                          )}
                        >
                          <span className="truncate">
                            {srId ? (srs.find(s => String(s.id) === String(srId))?.nombre ?? 'Sub receta…') : 'Sub receta…'}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                        </button>
                      )
                    )}
                  </div>

                  <Input type="number" min="0.001" step="0.001" className="h-8 text-xs" placeholder="Cant." {...register(`ingredientes.${i}.cantidad`)} />

                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-[var(--danger)]" onClick={() => handleRemove(i)} disabled={fields.length === 1}>
                    <MinusCircle className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
        {error && <p className="text-sm text-[var(--danger-text)] mt-2">{error}</p>}
      </FormModal>

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Eliminar receta" description={`¿Estás seguro de eliminar "${selected?.nombre}"? Esta acción no se puede deshacer.`} onConfirm={onDelete} loading={deleting} />
    </>
  );
}
