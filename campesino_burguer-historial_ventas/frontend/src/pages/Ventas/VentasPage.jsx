import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, PlusCircle, MinusCircle, Eye } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNum } from '@/lib/utils';

const detalleSchema = z.object({
  receta_id: z.coerce.number().min(1, 'Selecciona una receta'),
  cantidad: z.coerce.number().min(0.001, 'Cantidad requerida'),
});

const schema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  cliente: z.string().optional(),
  detalles: z.array(detalleSchema).min(1, 'Al menos un ítem'),
});

function formatCurrency(n) {
  return `$${parseFloat(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fecha: new Date().toISOString().slice(0, 10), cliente: '', detalles: [{ receta_id: '', cantidad: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'detalles' });
  const detallesWatch = useWatch({ control, name: 'detalles' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [v, r] = await Promise.all([api.get('/ventas'), api.get('/recetas')]);
      setVentas(v.data);
      setRecetas(r.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getReceta = (id) => recetas.find((r) => r.id === parseInt(id));

  const calcTotal = () =>
    (detallesWatch || []).reduce((sum, d) => {
      const r = getReceta(d.receta_id);
      return sum + (parseFloat(d.cantidad) || 0) * (r ? parseFloat(r.precio_venta) : 0);
    }, 0);

  const openCreate = () => {
    reset({ fecha: new Date().toISOString().slice(0, 10), cliente: '', detalles: [{ receta_id: '', cantidad: '' }] });
    setError('');
    setFormOpen(true);
  };

  const onSubmit = async (values) => {
    setSaving(true); setError('');
    try {
      await api.post('/ventas', values);
      toast.success('Venta registrada');
      setFormOpen(false);
      load();
    } catch (e) { setError(e.message); toast.error(e.message); }
    finally { setSaving(false); }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/ventas/${selected.id}`);
      toast.success('Venta eliminada');
      setConfirmOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'fecha', label: 'Fecha', render: (r) => r.fecha },
    { key: 'cliente', label: 'Cliente', render: (r) => r.cliente || <span style={{ color: 'var(--ink-faint)' }}>—</span> },
    { key: 'items', label: 'Ítems', render: (r) => r.detalles?.length || 0 },
    { key: 'total', label: 'Total', render: (r) => <span className="font-semibold">{formatCurrency(r.total)}</span> },
    {
      key: 'actions', label: '', width: 100,
      render: (r) => (
        <span className="flex items-center gap-1 justify-end">
          <Button size="icon" variant="ghost" onClick={() => { setSelected(r); setDetailOpen(true); }}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="text-[var(--danger)]" onClick={() => { setSelected(r); setConfirmOpen(true); }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Ventas"
        description="Registro de ventas de productos"
        action={<Button onClick={openCreate}><Plus className="w-4 h-4" />Nueva venta</Button>}
      />
      <DataTable columns={columns} data={ventas} loading={loading} emptyTitle="Sin ventas" emptyDescription="Registra tu primera venta." />

      {/* Form Modal */}
      <FormModal open={formOpen} onOpenChange={setFormOpen} title="Nueva venta" onSubmit={handleSubmit(onSubmit)} loading={saving}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Fecha *</Label>
            <Input type="date" className="mt-1" {...register('fecha')} />
            <FieldError message={errors.fecha?.message} />
          </div>
          <div>
            <Label>Cliente</Label>
            <Input className="mt-1" placeholder="Opcional" {...register('cliente')} />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Ítems *</Label>
            <Button type="button" size="sm" variant="ghost" onClick={() => append({ receta_id: '', cantidad: '' })}>
              <PlusCircle className="w-3.5 h-3.5" /> Agregar
            </Button>
          </div>

          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_90px_90px_28px] gap-2 mb-1 px-1">
            {['Receta', 'Cant.', 'Precio', 'Subtotal', ''].map((h) => (
              <span key={h} className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{h}</span>
            ))}
          </div>

          <div className="space-y-2">
            {fields.map((field, i) => {
              const d = detallesWatch?.[i];
              const receta = getReceta(d?.receta_id);
              const precio = receta ? parseFloat(receta.precio_venta) : 0;
              const cantidad = parseFloat(d?.cantidad) || 0;
              const subtotal = precio * cantidad;

              return (
                <div key={field.id} className="grid grid-cols-[1fr_80px_90px_90px_28px] gap-2 items-start">
                  <div>
                    <Controller
                      name={`detalles.${i}.receta_id`}
                      control={control}
                      render={({ field: f }) => (
                        <Select value={String(f.value || '')} onValueChange={(v) => f.onChange(parseInt(v))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Receta…" /></SelectTrigger>
                          <SelectContent>
                            {recetas.map((r) => (
                              <SelectItem key={r.id} value={String(r.id)}>
                                {r.nombre} {parseFloat(r.stock_actual) <= 0 ? '(sin stock)' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError message={errors.detalles?.[i]?.receta_id?.message} />
                  </div>

                  <div>
                    <Input type="number" min="0.001" step="0.001" className="h-8 text-xs" placeholder="0" {...register(`detalles.${i}.cantidad`)} />
                    <FieldError message={errors.detalles?.[i]?.cantidad?.message} />
                  </div>

                  <div className="h-8 flex items-center text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {precio > 0 ? formatCurrency(precio) : '—'}
                  </div>

                  <div className="h-8 flex items-center text-xs font-medium">
                    {subtotal > 0 ? formatCurrency(subtotal) : '—'}
                  </div>

                  <Button type="button" size="icon" variant="ghost" className="h-8 w-7 text-[var(--danger)]" onClick={() => remove(i)} disabled={fields.length === 1}>
                    <MinusCircle className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-3 pt-3 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-sm font-semibold">
              Total: <span style={{ color: 'var(--accent-text)' }}>{formatCurrency(calcTotal())}</span>
            </span>
          </div>
        </div>

        {error && <p className="text-sm mt-2" style={{ color: 'var(--danger-text)' }}>{error}</p>}
      </FormModal>

      {/* Detail Modal */}
      <FormModal open={detailOpen} onOpenChange={setDetailOpen} title={`Venta #${selected?.id}`} hideSubmit>
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span style={{ color: 'var(--ink-muted)' }}>Fecha:</span> <span className="ml-1 font-medium">{selected.fecha}</span></div>
              <div><span style={{ color: 'var(--ink-muted)' }}>Cliente:</span> <span className="ml-1 font-medium">{selected.cliente || '—'}</span></div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--ink-muted)' }}>ÍTEMS</p>
              <div className="space-y-1.5">
                {selected.detalles?.map((d) => (
                  <div key={d.id} className="flex justify-between text-sm">
                    <span>{d.receta?.nombre}</span>
                    <span style={{ color: 'var(--ink-muted)' }}>
                      {formatNum(d.cantidad)} × {formatCurrency(d.precio_unitario)} = <strong>{formatCurrency(d.subtotal)}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="font-semibold">Total: {formatCurrency(selected.total)}</span>
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar venta"
        description="¿Estás seguro? Esta acción no se puede deshacer y el stock NO se restaura automáticamente."
        onConfirm={onDelete}
        loading={deleting}
      />
    </>
  );
}
