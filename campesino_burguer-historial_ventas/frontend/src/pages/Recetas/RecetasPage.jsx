import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, PlusCircle, MinusCircle } from 'lucide-react';
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
import { formatNum, UNIDADES } from '@/lib/utils';

const ingSchema = z.object({
  tipo: z.enum(['materia_prima', 'sub_receta']),
  materia_prima_id: z.coerce.number().optional().nullable(),
  sub_receta_id: z.coerce.number().optional().nullable(),
  cantidad: z.coerce.number().min(0.001, 'Requerido'),
});

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  unidad_produccion: z.string().min(1, 'Requerido'),
  cantidad_produccion: z.coerce.number().min(0.001, 'Requerido'),
  precio_venta: z.coerce.number().min(0, 'Requerido'),
  costo_produccion: z.coerce.number().min(0, 'Requerido'),
  ingredientes: z.array(ingSchema).min(1, 'Al menos un ingrediente'),
});

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

  const openCreate = () => { setSelected(null); reset({ nombre: '', descripcion: '', unidad_produccion: '', cantidad_produccion: 1, precio_venta: 0, costo_produccion: 0, ingredientes: [blank()] }); setError(''); setFormOpen(true); };

  const openEdit = (row) => {
    setSelected(row);
    reset({
      nombre: row.nombre, descripcion: row.descripcion || '', unidad_produccion: row.unidad_produccion, cantidad_produccion: row.cantidad_produccion,
      precio_venta: row.precio_venta || 0, costo_produccion: row.costo_produccion || 0,
      ingredientes: row.ingredientes?.map((i) => ({ tipo: i.tipo, materia_prima_id: i.materia_prima_id ? String(i.materia_prima_id) : '', sub_receta_id: i.sub_receta_id ? String(i.sub_receta_id) : '', cantidad: i.cantidad })) || [blank()],
    });
    setError(''); setFormOpen(true);
  };

  const onSubmit = async (values) => {
    setSaving(true); setError('');
    try {
      if (selected) {
        await api.put(`/recetas/${selected.id}`, values);
        toast.success(`"${values.nombre}" actualizada`);
      } else {
        await api.post('/recetas', values);
        toast.success(`"${values.nombre}" creada`);
      }
      setFormOpen(false); load();
    } catch (e) { setError(e.message); toast.error(e.message); }
    finally { setSaving(false); }
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
          <div className="space-y-2">
            {fields.map((field, i) => {
              const tipo = ingredientes?.[i]?.tipo || 'materia_prima';
              return (
                <div key={field.id} className="grid grid-cols-[80px_1fr_80px_32px] gap-2 items-start">
                  <Select defaultValue={field.tipo} onValueChange={(v) => { setValue(`ingredientes.${i}.tipo`, v); setValue(`ingredientes.${i}.materia_prima_id`, ''); setValue(`ingredientes.${i}.sub_receta_id`, ''); }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="materia_prima">MP</SelectItem>
                      <SelectItem value="sub_receta">SubRec</SelectItem>
                    </SelectContent>
                  </Select>

                  <div>
                    <Select onValueChange={(v) => tipo === 'materia_prima' ? setValue(`ingredientes.${i}.materia_prima_id`, v) : setValue(`ingredientes.${i}.sub_receta_id`, v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={tipo === 'materia_prima' ? 'Materia prima' : 'Sub receta'} /></SelectTrigger>
                      <SelectContent>
                        {tipo === 'materia_prima'
                          ? mps.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>)
                          : srs.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <Input type="number" min="0.001" step="0.001" className="h-8 text-xs" placeholder="Cant." {...register(`ingredientes.${i}.cantidad`)} />

                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-[var(--danger)]" onClick={() => remove(i)} disabled={fields.length === 1}>
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
