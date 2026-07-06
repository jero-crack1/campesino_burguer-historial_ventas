import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AppLayout() {
  const location = useLocation();
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto bg-[var(--background)]">
        <div className="p-6 max-w-6xl mx-auto animate-fade-in">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
