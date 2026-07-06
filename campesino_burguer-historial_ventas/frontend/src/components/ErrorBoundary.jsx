import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-[var(--radius)] border border-dashed border-[var(--border)]">
          <AlertTriangle className="w-10 h-10 text-[var(--ink-faint)] mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-[var(--ink)]">Ocurrió un error al cargar esta página</p>
          <p className="text-sm text-[var(--ink-muted)] mt-1 max-w-xs">
            Intenta recargar. Si el problema persiste, contacta a soporte.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
            Recargar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
