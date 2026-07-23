import { useState, useEffect, useCallback } from 'react';
import { CreditCard, ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import PageHeader from '@/components/PageHeader';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

function fmt(n) {
  return `$${parseFloat(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const FILTROS = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'all', label: 'Todos' },
  { value: 'pagado', label: 'Pagados' },
];

export default function CreditosPage() {
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('pendiente');
  const [expanded, setExpanded] = useState(new Set());

  const [selectedCredito, setSelectedCredito] = useState(null);

  // Abonar
  const [abonarOpen, setAbonarOpen] = useState(false);
  const [montoAbono, setMontoAbono] = useState('');
  const [fechaAbono, setFechaAbono] = useState(new Date().toISOString().slice(0, 10));
  const [notasAbono, setNotasAbono] = useState('');
  const [savingAbono, setSavingAbono] = useState(false);

  // Pagar completo
  const [pagarOpen, setPagarOpen] = useState(false);
  const [savingPagar, setSavingPagar] = useState(false);

  // Editar cliente/teléfono/documento
  const [editarOpen, setEditarOpen] = useState(false);
  const [editCliente, setEditCliente] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editDocumento, setEditDocumento] = useState('');
  const [savingEditar, setSavingEditar] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filtro !== 'all' ? `?estado=${filtro}` : '';
      const r = await api.get(`/creditos${params}`);
      setCreditos(r.data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [filtro]);

  useEffect(() => { load(); }, [load]);

  const openAbonar = (c) => {
    setSelectedCredito(c);
    setMontoAbono('');
    setFechaAbono(new Date().toISOString().slice(0, 10));
    setNotasAbono('');
    setAbonarOpen(true);
  };

  const submitAbono = async () => {
    if (!montoAbono || parseFloat(montoAbono) <= 0) { toast.error('Ingresa un monto válido'); return; }
    setSavingAbono(true);
    try {
      await api.post(`/creditos/${selectedCredito.id}/abonar`, {
        monto: parseFloat(montoAbono),
        fecha: fechaAbono,
        notas: notasAbono || undefined,
      });
      toast.success('Abono registrado');
      setAbonarOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSavingAbono(false); }
  };

  const openEditar = (c) => {
    setSelectedCredito(c);
    setEditCliente(c.cliente || '');
    setEditTelefono(c.telefono || '');
    setEditDocumento(c.documento || '');
    setEditarOpen(true);
  };

  const submitEditar = async () => {
    setSavingEditar(true);
    try {
      await api.put(`/creditos/${selectedCredito.id}`, {
        cliente: editCliente.trim(),
        telefono: editTelefono.trim(),
        documento: editDocumento.trim(),
      });
      toast.success('Deuda actualizada');
      setEditarOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSavingEditar(false); }
  };

  const submitPagar = async () => {
    setSavingPagar(true);
    try {
      await api.post(`/creditos/${selectedCredito.id}/pagar`, { fecha: new Date().toISOString().slice(0, 10) });
      toast.success('Crédito pagado');
      setPagarOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSavingPagar(false); }
  };

  const toggleExpand = (id) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const saldoCredito = (c) => parseFloat((parseFloat(c.monto_total) - parseFloat(c.monto_pagado)).toFixed(2));
  const pctPagado = (c) => {
    const total = parseFloat(c.monto_total);
    if (!total) return 0;
    return Math.min(100, Math.round((parseFloat(c.monto_pagado) / total) * 100));
  };

  return (
    <>
      <PageHeader title="Créditos" description="Ventas a crédito y cobros pendientes" />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTROS.map(f => (
          <button key={f.value} type="button" onClick={() => setFiltro(f.value)}
            className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filtro === f.value ? 'var(--accent)' : 'var(--surface-2)',
              color: filtro === f.value ? 'var(--accent-foreground)' : 'var(--ink-muted)',
              border: filtro === f.value ? '1px solid var(--accent)' : '1px solid var(--border)',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20" style={{ color: 'var(--ink-muted)' }}>
          <p className="text-sm">Cargando...</p>
        </div>
      ) : creditos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--ink-muted)' }}>
          <CreditCard className="w-10 h-10 opacity-25" />
          <p className="text-sm">
            {filtro === 'pendiente' ? 'No hay créditos pendientes' : filtro === 'pagado' ? 'No hay créditos pagados' : 'No hay créditos'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {creditos.map(c => {
            const saldo = saldoCredito(c);
            const pct = pctPagado(c);
            const isPagado = c.estado === 'pagado';
            const isExpanded = expanded.has(c.id);

            return (
              <div key={c.id} className="rounded-xl border overflow-hidden"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

                {/* Card header */}
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Título + estado */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">
                        Venta #{String(c.venta_id).padStart(6, '0')}
                      </span>
                      {c.venta?.fecha && (
                        <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                          {fmtFecha(c.venta.fecha)}
                        </span>
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: isPagado ? 'var(--success-subtle, #dcfce7)' : 'oklch(0.97 0.05 60)',
                          color: isPagado ? 'var(--success-text, #15803d)' : 'oklch(0.5 0.15 50)',
                        }}>
                        {isPagado ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>

                    {(c.cliente || c.telefono || c.documento) && (
                      <p className="text-xs mb-2" style={{ color: 'var(--ink-muted)' }}>
                        {c.cliente && <>Cliente: <span style={{ color: 'var(--ink)' }}>{c.cliente}</span></>}
                        {c.telefono && <> · Tel: <span style={{ color: 'var(--ink)' }}>{c.telefono}</span></>}
                        {c.documento && <> · Doc: <span style={{ color: 'var(--ink)' }}>{c.documento}</span></>}
                      </p>
                    )}

                    {/* Montos */}
                    <div className="flex gap-5 flex-wrap">
                      <div>
                        <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Total deuda</p>
                        <p className="text-sm font-semibold">{fmt(c.monto_total)}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Pagado</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--success-text, #15803d)' }}>{fmt(c.monto_pagado)}</p>
                      </div>
                      {!isPagado && (
                        <div>
                          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Saldo pendiente</p>
                          <p className="text-sm font-bold" style={{ color: 'var(--danger-text)' }}>{fmt(saldo)}</p>
                        </div>
                      )}
                    </div>

                    {/* Barra de progreso */}
                    <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          background: isPagado ? 'var(--success-text, #15803d)' : 'var(--accent)',
                        }} />
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>{pct}% pagado</p>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-row sm:flex-col gap-1.5 shrink-0 flex-wrap">
                    {!isPagado && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openAbonar(c)}>
                          Abonar
                        </Button>
                        <Button size="sm" onClick={() => { setSelectedCredito(c); setPagarOpen(true); }}>
                          Pagar completo
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => openEditar(c)}>
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </Button>
                    {(c.abonos?.length > 0) && (
                      <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => toggleExpand(c.id)}>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        {c.abonos.length} abono{c.abonos.length !== 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Historial de abonos (expandible) */}
                {isExpanded && c.abonos?.length > 0 && (
                  <div className="px-5 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mt-3 mb-2"
                      style={{ color: 'var(--ink-muted)' }}>Historial de abonos</p>
                    <div className="space-y-1.5">
                      {c.abonos.map(a => (
                        <div key={a.id} className="flex justify-between items-center text-sm py-1.5 px-3 rounded-lg"
                          style={{ background: 'var(--surface-2)' }}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{fmt(a.monto)}</span>
                            {a.notas && <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{a.notas}</span>}
                          </div>
                          <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{fmtFecha(a.fecha)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal abonar */}
      <FormModal
        open={abonarOpen}
        onOpenChange={setAbonarOpen}
        title={`Abonar — Venta #${String(selectedCredito?.venta_id || 0).padStart(6, '0')}`}
        onSubmit={submitAbono}
        loading={savingAbono}
      >
        {selectedCredito && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg text-sm"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Total deuda</p>
                <p className="font-semibold">{fmt(selectedCredito.monto_total)}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Saldo pendiente</p>
                <p className="font-bold" style={{ color: 'var(--danger-text)' }}>{fmt(saldoCredito(selectedCredito))}</p>
              </div>
            </div>
            <div>
              <Label>Monto del abono *</Label>
              <Input type="number" min="0.01" step="0.01" className="mt-1" placeholder="$0"
                value={montoAbono} onChange={e => setMontoAbono(e.target.value)} />
            </div>
            <div>
              <Label>Fecha *</Label>
              <Input type="date" className="mt-1" value={fechaAbono} onChange={e => setFechaAbono(e.target.value)} />
            </div>
            <div>
              <Label>Notas <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(opcional)</span></Label>
              <Textarea className="mt-1" rows={2} placeholder="Ej: Transferencia Nequi"
                value={notasAbono} onChange={e => setNotasAbono(e.target.value)} />
            </div>
          </div>
        )}
      </FormModal>

      {/* Confirmar pago completo */}
      <ConfirmDialog
        open={pagarOpen}
        onOpenChange={setPagarOpen}
        title="Pagar crédito completo"
        description={`¿Confirmas el pago del saldo pendiente de ${fmt(selectedCredito ? saldoCredito(selectedCredito) : 0)}? El crédito quedará marcado como pagado.`}
        onConfirm={submitPagar}
        loading={savingPagar}
      />

      {/* Editar cliente/teléfono/documento */}
      <FormModal
        open={editarOpen}
        onOpenChange={setEditarOpen}
        title={`Editar deuda — Venta #${String(selectedCredito?.venta_id || 0).padStart(6, '0')}`}
        onSubmit={submitEditar}
        loading={savingEditar}
      >
        <div className="space-y-4">
          <div>
            <Label>Cliente</Label>
            <Input className="mt-1" value={editCliente} onChange={e => setEditCliente(e.target.value)} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input className="mt-1" value={editTelefono} onChange={e => setEditTelefono(e.target.value)} />
          </div>
          <div>
            <Label>Documento</Label>
            <Input className="mt-1" value={editDocumento} onChange={e => setEditDocumento(e.target.value)} />
          </div>
        </div>
      </FormModal>
    </>
  );
}
