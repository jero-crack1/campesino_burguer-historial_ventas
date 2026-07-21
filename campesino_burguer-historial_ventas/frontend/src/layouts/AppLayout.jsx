import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barra superior móvil/tablet */}
        <div
          className="flex lg:hidden items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="h-10 w-10 flex items-center justify-center rounded-[var(--radius)] text-[var(--ink)] hover:bg-[var(--surface-2)]"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img
            src="/LOGO Burguer.jpeg"
            alt="Campesino Burger"
            style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }}
          />
          <span className="font-semibold text-sm text-[var(--ink)]">Campesino Producción</span>
        </div>

        <main className="flex-1 overflow-y-auto bg-[var(--background)]">
          <div className="p-4 sm:p-6 max-w-6xl mx-auto animate-fade-in">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
