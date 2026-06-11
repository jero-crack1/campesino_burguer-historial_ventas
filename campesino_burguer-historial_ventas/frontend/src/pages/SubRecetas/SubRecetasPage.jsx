import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, PlusCircle, MinusCircle } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

  const { register, handleSubmit, control, reset, setValue, formState: { errors }, watch } = useForm({
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
      if (selected) await api.put(`/sub-recetas/${selected.id}`, values);
      else await api.post('/sub-recetas', values);
      setFormOpen(false); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const onDelete = async () => {
    setDeleting(true);
    try { await api.delete(`/sub-recetas/${selected.id}`); setConfirmOpen(false); load(); }
    catch (e) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'cantidad_produccion', label: 'Rinde', render: (r) => `${formatNum(r.cantidad_produccion)} ${r.unidad_produccion}` },
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
      <PageHeader title="Sub Recetas" description="Fórmulas de producción intermedias" action={<Button onClick={openCreate}><Plus className="w-4 h-4" />Nueva sub receta</Button>} />
      <DataTable columns={columns} data={items} loading={loading} emptyTitle="Sin sub recetas" emptyDescription="Crea tu primera fórmula intermedia." />

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

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Eliminar sub receta" description={`¿Eliminar "${selected?.nombre}"?`} onConfirm={onDelete} loading={deleting} />
    </>
  );
}
