import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ShoppingCart, History, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/services/api';
import FormModal from '@/components/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FieldError from '@/components/FieldError';

const facturaSchema = z.object({
  numeroFactura: z.string().max(50, 'Máximo 50 caracteres').optional(),
  cliente: z.string().max(255, 'Máximo 255 caracteres').optional(),
  observaciones: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
});

function fmt(n) {
  return `$${parseFloat(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtNum(n) {
  return parseFloat(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 3 });
}
function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f + 'T00:00:00').toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}
function ticketId(id) {
  return `#${String(id).padStart(6, '0')}`;
}

const DASH = '─'.repeat(52);

export default function FacturaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(facturaSchema),
  });

  useEffect(() => {
    api.get(`/ventas/${id}`)
      .then((r) => setVenta(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const openEdit = () => {
    reset({
      numeroFactura: venta.numero_factura || '',
      cliente: venta.cliente || '',
      observaciones: venta.observaciones || '',
    });
    setEditOpen(true);
  };

  const onSubmitFactura = async (values) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/ventas/${id}/factura`, values);
      setVenta(data);
      toast.success('Factura actualizada');
      setEditOpen(false);
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        <p>Cargando factura…</p>
      </div>
    );
  }

  if (error || !venta) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', gap: 12 }}>
        <p style={{ color: '#c00' }}>No se pudo cargar la venta: {error}</p>
        <button onClick={() => navigate('/historial')} style={btnStyle}>← Volver al historial</button>
      </div>
    );
  }

  const detalles = venta.detalles || [];
  const subtotalItems = detalles.reduce((s, d) => s + parseFloat(d.subtotal || 0), 0);
  const impoconsumoValor = parseFloat(venta.impoconsumo_valor || 0);
  const impoPct = parseFloat(venta.impoconsumo_porcentaje || 0);
  const total = parseFloat(venta.total || 0);
  const valorRecibido = parseFloat(venta.valor_recibido || 0);
  const cambio = parseFloat(venta.cambio || 0);

  return (
    <>
      <style>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }

        @media print {
          html, body, #root {
            width: 80mm !important;
            min-width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body * { visibility: hidden; }
          .no-print { display: none !important; }
          .ticket-print, .ticket-print * { visibility: visible; }
          .ticket-print {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 4mm 3mm !important;
            box-sizing: border-box !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
          }
          .ticket-print .ticket-logo {
            width: 62px !important;
            height: 62px !important;
          }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', gap: 24 }}>
        {/* Ticket */}
        <div className="ticket-print" style={{
          background: 'white',
          width: '100%',
          maxWidth: 420,
          padding: '28px 24px',
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: 13,
          lineHeight: 1.6,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          borderRadius: 4,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <img
              className="ticket-logo"
              src="/LOGO Burguer.jpeg"
              alt="Campesino Burger"
              style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: '50%', flexShrink: 0, border: '2px solid #eee' }}
            />
            <div>
              <p style={{ fontWeight: 900, fontSize: 16, letterSpacing: 1, marginBottom: 2 }}>CAMPESINO BURGER</p>
              <p style={{ fontWeight: 700, fontSize: 10 }}>RESTAURANTE &amp; BURGERS</p>
              <p style={{ fontSize: 10, color: '#555', marginTop: 5 }}>NIT: 1030688603</p>
              <p style={{ fontSize: 10, color: '#555' }}>Tel: 310 884 3042</p>
              <p style={{ fontSize: 10, color: '#555' }}>campesinoburger22@gmail.com</p>
            </div>
          </div>

          <p style={{ borderBottom: '1px dashed #999', margin: '10px 0' }} />

          {/* Info transacción */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span><strong>Fecha:</strong> {fmtFecha(venta.fecha)}</span>
            <span><strong>Ticket:</strong> {ticketId(venta.id)}</span>
          </div>
          {venta.numero_factura && (
            <p style={{ marginBottom: 4 }}><strong>N.° Factura:</strong> {venta.numero_factura}</p>
          )}
          {venta.cliente && (
            <p style={{ marginBottom: 4 }}><strong>Cliente:</strong> {venta.cliente}</p>
          )}
          {venta.metodo_pago && (
            <p style={{ marginBottom: 4 }}><strong>Método de pago:</strong> {venta.metodo_pago}</p>
          )}

          <p style={{ borderBottom: '1px dashed #999', margin: '10px 0' }} />

          {/* Encabezado tabla */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 6, fontSize: 12 }}>
            <span style={{ flex: 1 }}>Descripción</span>
            <span style={{ width: 50, textAlign: 'right' }}>Cant.</span>
            <span style={{ width: 80, textAlign: 'right' }}>Total</span>
          </div>

          {/* Items */}
          {detalles.map((d, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ flex: 1, marginRight: 8 }}>{d.receta?.nombre || '—'}</span>
                <span style={{ width: 50, textAlign: 'right' }}>{fmtNum(d.cantidad)}</span>
                <span style={{ width: 80, textAlign: 'right' }}>{fmt(d.subtotal)}</span>
              </div>
              <div style={{ fontSize: 11, color: '#777', paddingLeft: 0 }}>
                {fmtNum(d.cantidad)} × {fmt(d.precio_unitario)}
              </div>
            </div>
          ))}

          <p style={{ borderBottom: '1px dashed #999', margin: '10px 0' }} />

          {/* Totales */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#555' }}>SUBTOTAL:</span>
              <span>{fmt(subtotalItems)}</span>
            </div>
            {impoconsumoValor > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#555' }}>IMPOCONSUMO ({impoPct}%):</span>
                <span>{fmt(impoconsumoValor)}</span>
              </div>
            )}
            <p style={{ borderBottom: '1px dashed #999', margin: '6px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 15 }}>
              <span>TOTAL:</span>
              <span>{fmt(total)}</span>
            </div>
            {valorRecibido > 0 && (
              <>
                <p style={{ borderBottom: '1px dashed #999', margin: '6px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555' }}>RECIBIDO:</span>
                  <span>{fmt(valorRecibido)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555' }}>CAMBIO:</span>
                  <span>{fmt(cambio)}</span>
                </div>
              </>
            )}
          </div>

          {venta.observaciones && (
            <>
              <p style={{ borderBottom: '1px dashed #999', margin: '12px 0' }} />
              <p style={{ fontSize: 11 }}><strong>Observaciones:</strong> {venta.observaciones}</p>
            </>
          )}

          <p style={{ borderBottom: '1px dashed #999', margin: '12px 0' }} />

          {/* Footer */}
          <p style={{ textAlign: 'center', fontStyle: 'italic', fontSize: 12 }}>
            ¡Gracias por preferirnos!
          </p>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#555', marginTop: 6 }}>
            📷 Instagram: @campesino_burger
          </p>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#555', marginTop: 2 }}>
            👍 Facebook: Campesino burger
          </p>
        </div>

        {/* Botones (no se imprimen) */}
        <div className="no-print" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => window.print()} style={{ ...btnStyle, background: '#1a1a1a', color: 'white' }}>
            <Printer size={15} /> Imprimir
          </button>
          <button onClick={openEdit} style={btnStyle}>
            <Pencil size={15} /> Editar factura
          </button>
          <button onClick={() => navigate('/ventas')} style={btnStyle}>
            <ShoppingCart size={15} /> Nueva venta
          </button>
          <button onClick={() => navigate('/historial')} style={btnStyle}>
            <History size={15} /> Historial
          </button>
        </div>
      </div>

      <FormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Editar información de factura"
        description="Estos datos se ingresan manualmente y no afectan el inventario ni los totales de la venta."
        onSubmit={handleSubmit(onSubmitFactura)}
        loading={saving}
      >
        <div>
          <Label htmlFor="numeroFactura">Número de factura</Label>
          <Input id="numeroFactura" placeholder={ticketId(venta.id)} {...register('numeroFactura')} />
          <FieldError message={errors.numeroFactura?.message} />
        </div>
        <div>
          <Label htmlFor="cliente">Cliente</Label>
          <Input id="cliente" {...register('cliente')} />
          <FieldError message={errors.cliente?.message} />
        </div>
        <div>
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea id="observaciones" rows={3} {...register('observaciones')} />
          <FieldError message={errors.observaciones?.message} />
        </div>
      </FormModal>
    </>
  );
}

const btnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 18px',
  border: '1px solid #ccc',
  borderRadius: 6,
  background: 'white',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
};
