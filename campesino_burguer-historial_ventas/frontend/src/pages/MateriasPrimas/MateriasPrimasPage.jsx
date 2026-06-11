import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { UNIDADES } from '@/lib/utils';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  unidad_medida: z.string().min(1, 'Unidad requerida'),
  stock_minimo: z.coerce.number().min(0).default(0),
  precio_unitario: z.coerce.number().min(0).default(0),
});

export default function MateriasPrimasPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

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

  const openCreate = () => { setSelected(null); reset({}); setError(''); setFormOpen(true); };
  const openEdit = (row) => { setSelected(row); reset({ ...row, stock_minimo: row.stock_minimo, precio_unitario: row.precio_unitario }); setError(''); setFormOpen(true); };
  const openDelete = (row) => { setSelected(row); setConfirmOpen(true); };

  const onSubmit = async (values) => {
    setSaving(true);
    setError('');
    try {
      if (selected) await api.put(`/materias-primas/${selected.id}`, values);
      else await api.post('/materias-primas', values);
      setFormOpen(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/materias-primas/${selected.id}`);
      setConfirmOpen(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'unidad_medida', label: 'Unidad' },
    { key: 'stock', label: 'Stock', render: (r) => <StockBadge stock={r.stock_actual} minimo={r.stock_minimo} unidad={r.unidad_medida} /> },
    { key: 'precio_unitario', label: 'Precio / unidad', render: (r) => `$${parseFloat(r.precio_unitario).toLocaleString('es-CO')}` },
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

      <DataTable columns={columns} data={items} loading={loading} emptyTitle="Sin materias primas" emptyDescription="Registra tu primer insumo para comenzar." />

      <FormModal open={formOpen} onOpenChange={setFormOpen} title={selected ? 'Editar materia prima' : 'Nueva materia prima'} onSubmit={handleSubmit(onSubmit)} loading={saving}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Nombre *</Label>
            <Input className="mt-1" placeholder="Ej: Harina de trigo" {...register('nombre')} />
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
            <Label>Precio por unidad (COP)</Label>
            <Input type="number" min="0" step="1" className="mt-1" {...register('precio_unitario')} />
            <FieldError message={errors.precio_unitario?.message} />
          </div>
          <div>
            <Label>Stock mínimo</Label>
            <Input type="number" min="0" step="0.001" className="mt-1" {...register('stock_minimo')} />
            <FieldError message={errors.stock_minimo?.message} />
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
        description={`¿Eliminar "${selected?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={onDelete}
        loading={deleting}
      />
    </>
  );
}
