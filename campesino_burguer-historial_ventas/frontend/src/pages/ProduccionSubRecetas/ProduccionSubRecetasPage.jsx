import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  sub_receta_id: z.coerce.number().min(1, 'Sub receta requerida'),
  cantidad_lotes: z.coerce.number().int().min(1, 'Mínimo 1 lote'),
  fecha: z.string().min(1, 'Fecha requerida'),
  notas: z.string().optional(),
});

export default function ProduccionSubRecetasPage() {
  const [items, setItems] = useState([]);
  const [srs, setSrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [selectedSr, setSelectedSr] = useState(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const srId = watch('sub_receta_id');
  const lotes = watch('cantidad_lotes');

  useEffect(() => {
    if (srId) setSelectedSr(srs.find((s) => String(s.id) === String(srId)) || null);
  }, [srId, srs]);

  const produccion = selectedSr ? parseFloat(selectedSr.cantidad_produccion) * (parseInt(lotes) || 0) : 0;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([api.get('/produccion-sub-recetas'), api.get('/sub-recetas')]);
      setItems(p.data); setSrs(s.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    reset({ sub_receta_id: '', cantidad_lotes: 1, fecha: new Date().toISOString().split('T')[0], notas: '' });
    setSelectedSr(null); setError(''); setFormOpen(true);
  };

  const onSubmit = async (values) => {
    setSaving(true); setError('');
    try {
      await api.post('/produccion-sub-recetas', values);
      setFormOpen(false); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'subReceta', label: 'Sub Receta', render: (r) => r.subReceta?.nombre || '—' },
    { key: 'cantidad_lotes', label: 'Lotes', render: (r) => `${r.cantidad_lotes} lote(s)` },
    { key: 'producido', label: 'Producido', render: (r) => r.subReceta ? `${formatNum(parseFloat(r.subReceta.cantidad_produccion) * r.cantidad_lotes)} ${r.subReceta.unidad_produccion}` : '—' },
    { key: 'fecha', label: 'Fecha', render: (r) => formatDate(r.fecha) },
    { key: 'notas', label: 'Notas', render: (r) => r.notas || '—' },
  ];

  return (
    <>
      <PageHeader title="Producción de Sub Recetas" description="Ejecuta lotes — consume materias primas y genera stock de sub recetas"
        action={<Button onClick={openCreate}><Plus className="w-4 h-4" />Nuevo lote</Button>} />
      <DataTable columns={columns} data={items} loading={loading} emptyTitle="Sin producciones" emptyDescription="Ejecuta tu primer lote de sub receta." />

      <FormModal open={formOpen} onOpenChange={setFormOpen} title="Nuevo lote de sub receta" onSubmit={handleSubmit(onSubmit)} loading={saving} submitLabel="Producir">
        <div className="space-y-4">
          <div>
            <Label>Sub Receta *</Label>
            <Select onValueChange={(v) => setValue('sub_receta_id', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar sub receta" /></SelectTrigger>
              <SelectContent>{srs.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nombre} (stock: {formatNum(s.stock_actual)} {s.unidad_produccion})</SelectItem>)}</SelectContent>
            </Select>
            <FieldError message={errors.sub_receta_id?.message} />
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

          {selectedSr && (
            <div className="rounded-[var(--radius)] bg-[var(--accent-subtle)] px-4 py-3 text-sm">
              <p className="font-medium text-[var(--accent-text)]">Resumen de producción</p>
              <p className="text-[var(--ink-muted)] mt-1">Producirá <strong>{formatNum(produccion)} {selectedSr.unidad_produccion}</strong></p>
              <p className="text-[var(--ink-muted)] text-xs mt-1">Consumirá las materias primas definidas en la fórmula × {lotes || 0} lote(s)</p>
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
