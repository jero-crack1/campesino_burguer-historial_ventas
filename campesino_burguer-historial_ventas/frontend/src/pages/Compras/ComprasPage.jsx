import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, PlusCircle, MinusCircle, Eye } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import FieldError from '@/components/FieldError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCOP, formatDate, formatNum } from '@/lib/utils';

const detalleSchema = z.object({
  materia_prima_id: z.coerce.number().min(1, 'Requerido'),
  cantidad: z.coerce.number().min(0.001, 'Cantidad requerida'),
  precio_unitario: z.coerce.number().min(0, 'Requerido'),
});

const schema = z.object({
  fecha: z.string().min(1, 'Fecha requerida'),
  notas: z.string().optional(),
  detalles: z.array(detalleSchema).min(1, 'Al menos un ítem'),
});

export default function ComprasPage() {
  const [items, setItems] = useState([]);
  const [mps, setMps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { detalles: [{ materia_prima_id: '', cantidad: '', precio_unitario: '' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'detalles' });
  const detalles = watch('detalles');
  const total = detalles?.reduce((sum, d) => sum + (parseFloat(d.cantidad || 0) * parseFloat(d.precio_unitario || 0)), 0) || 0;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([api.get('/compras'), api.get('/materias-primas')]);
      setItems(c.data); setMps(m.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    reset({ fecha: new Date().toISOString().split('T')[0], notas: '', detalles: [{ materia_prima_id: '', cantidad: '', precio_unitario: '' }] });
    setError(''); setFormOpen(true);
  };

  const onSubmit = async (values) => {
    setSaving(true); setError('');
    try {
      await api.post('/compras', values);
      setFormOpen(false);
      toast.success('Compra registrada y stock actualizado');
      load();
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/compras/${selected.id}`);
      setConfirmOpen(false);
      toast.success(`Compra del ${formatDate(selected.fecha)} eliminada`);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally { setDeleting(false); }
  };

  const mpName = (id) => mps.find((m) => m.id === id)?.nombre || `MP #${id}`;
  const mpUnit = (id) => mps.find((m) => m.id === id)?.unidad_medida || '';

  const columns = [
    { key: 'fecha', label: 'Fecha', render: (r) => formatDate(r.fecha) },
    { key: 'items', label: 'Ítems', render: (r) => `${r.detalles?.length || 0} ítem(s)` },
    { key: 'total', label: 'Total', render: (r) => formatCOP(r.total) },
    { key: 'notas', label: 'Observaciones', render: (r) => r.notas || '—' },
    {
      key: 'actions', label: '', width: 90,
      render: (r) => (
        <span className="flex items-center gap-1 justify-end">
          <Button size="icon" variant="ghost" onClick={() => { setSelected(r); setDetailOpen(true); }}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => { setSelected(r); setConfirmOpen(true); }} className="text-[var(--danger)]">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Compras"
        description="Registro de compras con incremento automático de stock"
        action={<Button onClick={openCreate}><Plus className="w-4 h-4" />Nueva compra</Button>}
      />

      <DataTable columns={columns} data={items} loading={loading} emptyTitle="Sin compras" emptyDescription="Registra tu primera compra de materias primas." />

      {/* Modal crear compra */}
      <FormModal open={formOpen} onOpenChange={setFormOpen} title="Nueva compra" onSubmit={handleSubmit(onSubmit)} loading={saving} submitLabel="Registrar compra">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Label>Fecha *</Label>
            <Input type="date" className="mt-1" {...register('fecha')} />
            <FieldError message={errors.fecha?.message} />
          </div>
          <div className="col-span-2">
            <Label>Observaciones</Label>
            <Textarea className="mt-1" rows={2} placeholder="Notas adicionales…" {...register('notas')} />
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Ítems *</Label>
            <Button type="button" size="sm" variant="ghost" onClick={() => append({ materia_prima_id: '', cantidad: '', precio_unitario: '' })}>
              <PlusCircle className="w-3.5 h-3.5" /> Agregar
            </Button>
          </div>

          <div className="space-y-2">
            {fields.map((field, i) => (
              <div key={field.id} className="grid grid-cols-[1fr_80px_90px_32px] gap-2 items-start">
                <div>
                  <Select onValueChange={(v) => setValue(`detalles.${i}.materia_prima_id`, v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Materia prima" /></SelectTrigger>
                    <SelectContent>{mps.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.nombre} ({m.unidad_medida})</SelectItem>)}</SelectContent>
                  </Select>
                  <FieldError message={errors.detalles?.[i]?.materia_prima_id?.message} />
                </div>
                <div>
                  <Input type="number" min="0.001" step="0.001" className="h-8 text-xs" placeholder="Cant." {...register(`detalles.${i}.cantidad`)} />
                  <FieldError message={errors.detalles?.[i]?.cantidad?.message} />
                </div>
                <div>
                  <Input type="number" min="0" step="1" className="h-8 text-xs" placeholder="Precio" {...register(`detalles.${i}.precio_unitario`)} />
                  <FieldError message={errors.detalles?.[i]?.precio_unitario?.message} />
                </div>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-[var(--danger)]" onClick={() => remove(i)} disabled={fields.length === 1}>
                  <MinusCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <span className="text-sm font-semibold text-[var(--ink)]">Total: {formatCOP(total)}</span>
          </div>
        </div>
        {error && <p className="text-sm text-[var(--danger-text)] mt-2">{error}</p>}
      </FormModal>

      {/* Modal ver detalles */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de compra — {selected ? formatDate(selected.fecha) : ''}</DialogTitle>
          </DialogHeader>
          {selected?.notas && (
            <p className="text-sm text-[var(--ink-muted)] -mt-2 mb-2">{selected.notas}</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--ink-muted)] text-xs">
                  <th className="text-left py-2 pr-3 font-medium">Materia prima</th>
                  <th className="text-right py-2 px-3 font-medium">Cantidad</th>
                  <th className="text-right py-2 px-3 font-medium">Precio/u</th>
                  <th className="text-right py-2 pl-3 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {selected?.detalles?.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2 pr-3 text-[var(--ink)]">{mpName(d.materia_prima_id)}</td>
                    <td className="py-2 px-3 text-right text-[var(--ink-muted)]">{formatNum(d.cantidad)} {mpUnit(d.materia_prima_id)}</td>
                    <td className="py-2 px-3 text-right text-[var(--ink-muted)]">{formatCOP(d.precio_unitario)}</td>
                    <td className="py-2 pl-3 text-right font-medium text-[var(--ink)]">{formatCOP(parseFloat(d.cantidad) * parseFloat(d.precio_unitario))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--border-strong)]">
                  <td colSpan={3} className="py-3 pr-3 text-right text-sm font-semibold text-[var(--ink)]">Total</td>
                  <td className="py-3 pl-3 text-right text-sm font-semibold text-[var(--accent)]">{formatCOP(selected?.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen} onOpenChange={setConfirmOpen}
        title="Eliminar compra"
        description={`¿Estás seguro de eliminar la compra del ${selected ? formatDate(selected.fecha) : ''}? El stock no se revertirá y esta acción no se puede deshacer.`}
        onConfirm={onDelete} loading={deleting}
      />
    </>
  );
}
