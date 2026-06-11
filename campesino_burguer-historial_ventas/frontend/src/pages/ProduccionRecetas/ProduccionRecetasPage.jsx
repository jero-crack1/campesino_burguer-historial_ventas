import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import FieldError from '@/components/FieldError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatNum } from '@/lib/utils';

const schema = z.object({
  receta_id: z.coerce.number().min(1, 'Receta requerida'),
  cantidad_lotes: z.coerce.number().int().min(1, 'Mínimo 1 lote'),
  fecha: z.string().min(1, 'Fecha requerida'),
  notas: z.string().optional(),
});

export default function ProduccionRecetasPage() {
  const [items, setItems] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [selectedR, setSelectedR] = useState(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const recetaId = watch('receta_id');
  const lotes = watch('cantidad_lotes');

  useEffect(() => {
    if (recetaId) setSelectedR(recetas.find((r) => String(r.id) === String(recetaId)) || null);
  }, [recetaId, recetas]);

  const produccion = selectedR ? parseFloat(selectedR.cantidad_produccion) * (parseInt(lotes) || 0) : 0;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([api.get('/produccion-recetas'), api.get('/recetas')]);
      setItems(p.data); setRecetas(r.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    reset({ receta_id: '', cantidad_lotes: 1, fecha: new Date().toISOString().split('T')[0], notas: '' });
    setSelectedR(null); setError(''); setFormOpen(true);
  };

  const onSubmit = async (values) => {
    setSaving(true); setError('');
    try {
      await api.post('/produccion-recetas', values);
      setFormOpen(false);
      toast.success(`Lote de "${selectedR?.nombre}" producido — stock actualizado`);
      load();
    } catch (e) { setError(e.message); toast.error(e.message); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'receta', label: 'Receta', render: (r) => r.receta?.nombre || '—' },
    { key: 'cantidad_lotes', label: 'Lotes', render: (r) => `${r.cantidad_lotes} lote(s)` },
    { key: 'producido', label: 'Producido', render: (r) => r.receta ? `${formatNum(parseFloat(r.receta.cantidad_produccion) * r.cantidad_lotes)} ${r.receta.unidad_produccion}` : '—' },
    { key: 'fecha', label: 'Fecha', render: (r) => formatDate(r.fecha) },
    { key: 'notas', label: 'Notas', render: (r) => r.notas || '—' },
  ];

  return (
    <>
      <PageHeader title="Producción de Recetas" description="Ejecuta lotes — consume sub recetas y/o materias primas, genera stock de recetas"
        action={<Button onClick={openCreate}><Plus className="w-4 h-4" />Nuevo lote</Button>} />
      <DataTable columns={columns} data={items} loading={loading} emptyTitle="Sin producciones" emptyDescription="Ejecuta tu primer lote de receta." />

      <FormModal open={formOpen} onOpenChange={setFormOpen} title="Nuevo lote de receta" onSubmit={handleSubmit(onSubmit)} loading={saving} submitLabel="Producir">
        <div className="space-y-4">
          <div>
            <Label>Receta *</Label>
            <Select onValueChange={(v) => setValue('receta_id', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar receta" /></SelectTrigger>
              <SelectContent>{recetas.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.nombre} (stock: {formatNum(r.stock_actual)} {r.unidad_produccion})</SelectItem>)}</SelectContent>
            </Select>
            <FieldError message={errors.receta_id?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cantidad de lotes *</Label>
              <Input type="number" min="1" step="1" className="mt-1" {...register('cantidad_lotes')} />
              <FieldError message={errors.cantidad_lotes?.message} />
            </div>
            <div>
              <Label>Fecha *</Label>
              <Input type="date" className="mt-1" {...register('fecha')} />
              <FieldError message={errors.fecha?.message} />
            </div>
          </div>

          {selectedR && (
            <div className="rounded-[var(--radius)] bg-[var(--accent-subtle)] px-4 py-3 text-sm">
              <p className="font-medium text-[var(--accent-text)]">Resumen de producción</p>
              <p className="text-[var(--ink-muted)] mt-1">Producirá <strong>{formatNum(produccion)} {selectedR.unidad_produccion}</strong></p>
              <p className="text-[var(--ink-muted)] text-xs mt-1">Consumirá sub recetas y/o materias primas definidas × {lotes || 0} lote(s)</p>
            </div>
          )}

          <div>
            <Label>Notas</Label>
            <Textarea className="mt-1" rows={2} placeholder="Observaciones del lote…" {...register('notas')} />
          </div>
        </div>
        {error && <p className="text-sm text-[var(--danger-text)] mt-2">{error}</p>}
      </FormModal>
    </>
  );
}
