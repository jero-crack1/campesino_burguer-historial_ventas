import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { formatNum } from '@/lib/utils';

const POLL_MS = 60000;

export default function StockAlertBell({ dark = false }) {
  const [alertas, setAlertas] = useState([]);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const ref = useRef(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/reportes/stock/critico');
      setAlertas(data || []);
    } catch {
      // silencioso: no interrumpir la navegación por un fallo de esta alerta secundaria
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (ref.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const count = alertas.length;
  const iconColor = dark ? 'text-white/70 hover:text-white' : 'text-[var(--ink-muted)] hover:text-[var(--ink)]';
  const PANEL_WIDTH = 320;

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const left = Math.min(Math.max(8, dark ? r.left : r.right - PANEL_WIDTH), window.innerWidth - PANEL_WIDTH - 8);
      setCoords({ top: r.bottom + 8, left });
      load();
    }
    setOpen((o) => !o);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`relative h-9 w-9 flex items-center justify-center rounded-[var(--radius)] transition-colors ${iconColor}`}
        aria-label="Alertas de stock"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: 'var(--danger)', color: 'white' }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && coords && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[70] max-h-96 overflow-y-auto rounded-lg border shadow-lg"
          style={{ top: coords.top, left: coords.left, width: PANEL_WIDTH, background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--danger-text)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Stock en o bajo el mínimo</p>
          </div>

          {count === 0 ? (
            <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--ink-muted)' }}>Todo el inventario está por encima del mínimo.</p>
          ) : (
            <ul>
              {alertas.map((a) => (
                <li key={`${a.tipo}-${a.id}`} className="px-4 py-2.5 flex items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{a.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>{a.tipo === 'materia_prima' ? 'Materia prima' : 'Producto'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold" style={{ color: 'var(--danger-text)' }}>
                      {formatNum(a.stock_actual)} {a.unidad}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>mín. {formatNum(a.stock_minimo)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {count > 0 && (
            <div className="px-4 py-2" style={{ borderTop: '1px solid var(--border)' }}>
              <Link to="/materias-primas" onClick={() => setOpen(false)} className="text-xs font-medium" style={{ color: 'var(--accent-text)' }}>
                Ver materias primas →
              </Link>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
