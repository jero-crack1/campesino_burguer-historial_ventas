import { NavLink } from 'react-router-dom';
import { ShoppingCart, Package, BookOpen, ChefHat, FlaskConical, Layers, LogOut, ReceiptText, BarChart3, History, CreditCard, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const gestión = [
  { label: 'Materias Primas', to: '/materias-primas', icon: Package },
  { label: 'Compras', to: '/compras', icon: ShoppingCart },
  { label: 'Sub Recetas', to: '/sub-recetas', icon: FlaskConical },
  { label: 'Recetas', to: '/recetas', icon: BookOpen },
];

const producción = [
  { label: 'Producir Sub Receta', to: '/produccion/sub-recetas', icon: Layers },
  { label: 'Producir Receta', to: '/produccion/recetas', icon: ChefHat },
];

const ventas = [
  { label: 'Ventas', to: '/ventas', icon: ReceiptText },
  { label: 'Créditos', to: '/creditos', icon: CreditCard },
  { label: 'Historial', to: '/historial', icon: History },
  { label: 'Reportes', to: '/reportes', icon: BarChart3 },
];

export default function AppSidebar({ open = false, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Overlay (solo móvil/tablet, cuando el drawer está abierto) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'w-64 flex-shrink-0 flex flex-col h-full overflow-y-auto fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out',
          'lg:static lg:z-auto lg:w-56 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
      >
        {/* Brand */}
        <div className="px-5 py-5 flex items-start justify-between gap-3">
          <div className="flex flex-col items-start gap-3">
            <img
              src="/LOGO Burguer.jpeg"
              alt="Campesino Burger"
              style={{ width: 108, height: 108, objectFit: 'cover', borderRadius: '50%', flexShrink: 0, border: '3px solid rgba(255,255,255,0.28)' }}
            />
            <div className="text-left min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">Campesino</p>
              <p className="text-white/40 text-xs leading-tight">Producción</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden shrink-0 h-9 w-9 flex items-center justify-center rounded-[var(--radius)] text-white/60 hover:text-white/90"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      <div className="h-px mx-4 mb-3" style={{ background: 'var(--sidebar-border)' }} />

      {/* Nav */}
      <nav className="flex-1 px-2 pb-4 space-y-0.5">
        <SectionLabel>Gestión</SectionLabel>
        {gestión.map((item) => <NavItem key={item.to} {...item} />)}

        <SectionLabel className="mt-4">Producción</SectionLabel>
        {producción.map((item) => <NavItem key={item.to} {...item} />)}

        <SectionLabel className="mt-4">Ventas</SectionLabel>
        {ventas.map((item) => <NavItem key={item.to} {...item} />)}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: '12px' }}>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.username || 'Admin'}</p>
            <p className="text-white/40 text-xs truncate">{user?.role || 'ADMIN'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[var(--radius)] text-sm transition-colors duration-150 text-white/60 hover:text-white/90"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
      </aside>
    </>
  );
}

function SectionLabel({ children, className = '' }) {
  return (
    <p className={`px-2 mb-2 text-xs font-medium uppercase tracking-wide ${className}`} style={{ color: 'oklch(0.45 0.008 265)' }}>
      {children}
    </p>
  );
}

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius)] text-sm transition-colors duration-150',
          isActive
            ? 'bg-[var(--sidebar-active)] text-white font-medium'
            : 'text-white/60 hover:bg-[var(--sidebar-hover)] hover:text-white/90'
        )
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}
