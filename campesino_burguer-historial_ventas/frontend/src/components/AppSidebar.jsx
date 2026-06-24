import { NavLink } from 'react-router-dom';
import { ShoppingCart, Package, BookOpen, ChefHat, FlaskConical, Layers, LogOut, ReceiptText, BarChart3, History } from 'lucide-react';
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
  { label: 'Historial', to: '/historial', icon: History },
  { label: 'Reportes', to: '/reportes', icon: BarChart3 },
];

export default function AppSidebar() {
  const { user, logout } = useAuth();

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col h-full overflow-y-auto"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Brand */}
      <div className="px-4 py-4 flex items-center gap-2.5">
        <img
          src="/LOGO Burguer.jpeg"
          alt="Campesino Burger"
          style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}
        />
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate leading-tight">Campesino</p>
          <p className="text-white/40 text-xs truncate leading-tight">Producción</p>
        </div>
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
