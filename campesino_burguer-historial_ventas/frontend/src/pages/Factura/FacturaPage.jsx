import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ShoppingCart, History } from 'lucide-react';
import api from '@/services/api';

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

  useEffect(() => {
    api.get(`/ventas/${id}`)
      .then((r) => setVenta(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

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
  const descuento = parseFloat(venta.descuento_aplicado || 0);
  const total = parseFloat(venta.total || 0);
  const valorRecibido = parseFloat(venta.valor_recibido || 0);
  const cambio = parseFloat(venta.cambio || 0);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', gap: 24 }}>
        {/* Ticket */}
        <div style={{
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
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <img src="/logo.png" alt="Campesino Burger" style={{ width: 72, height: 72, objectFit: 'contain', margin: '0 auto 8px' }} />
            <p style={{ fontWeight: 900, fontSize: 18, letterSpacing: 2, marginBottom: 2 }}>CAMPESINO BURGER</p>
            <p style={{ fontWeight: 700, fontSize: 11 }}>RESTAURANTE &amp; BURGERS</p>
            <p style={{ fontSize: 11, color: '#555', marginTop: 6 }}>NIT: 1030688603</p>
            <p style={{ fontSize: 11, color: '#555' }}>Tel: 310 884 3042</p>
            <p style={{ fontSize: 11, color: '#555' }}>campesinoburger22@gmail.com</p>
          </div>

          <p style={{ borderBottom: '1px dashed #999', margin: '10px 0' }} />

          {/* Info transacción */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span><strong>Fecha:</strong> {fmtFecha(venta.fecha)}</span>
            <span><strong>Ticket:</strong> {ticketId(venta.id)}</span>
          </div>
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
            {descuento > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#555' }}>DESCUENTO:</span>
                <span>- {fmt(descuento)}</span>
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

          <p style={{ borderBottom: '1px dashed #999', margin: '12px 0' }} />

          {/* Footer */}
          <p style={{ textAlign: 'center', fontStyle: 'italic', fontSize: 12 }}>
            ¡Gracias por preferirnos!
          </p>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#999', marginTop: 4 }}>
            www.campesinoburger.com
          </p>
        </div>

        {/* Botones (no se imprimen) */}
        <div className="no-print" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => window.print()} style={{ ...btnStyle, background: '#1a1a1a', color: 'white' }}>
            <Printer size={15} /> Imprimir
          </button>
          <button onClick={() => navigate('/ventas')} style={btnStyle}>
            <ShoppingCart size={15} /> Nueva venta
          </button>
          <button onClick={() => navigate('/historial')} style={btnStyle}>
            <History size={15} /> Historial
          </button>
        </div>
      </div>
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
