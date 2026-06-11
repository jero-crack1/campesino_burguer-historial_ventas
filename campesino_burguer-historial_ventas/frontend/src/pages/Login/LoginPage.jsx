import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { UtensilsCrossed, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

const schema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(data) {
    setServerError('');
    try {
      const res = await api.post('/auth/login', data);
      login(res.data.token, res.data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Error al iniciar sesión');
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--surface)' }}
      >
        {/* Header */}
        <div
          className="px-8 pt-8 pb-6 flex flex-col items-center gap-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
              Campesino Burguer
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--ink-muted)' }}>
              Sistema de Producción
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-7 space-y-5">
          {serverError && (
            <div
              className="text-sm px-3 py-2.5 rounded-lg"
              style={{ background: 'var(--danger-subtle)', color: 'var(--danger-text)' }}
            >
              {serverError}
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium"
              style={{ color: 'var(--ink)' }}
              htmlFor="username"
            >
              Usuario
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              {...register('username')}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
              style={{
                background: 'var(--background)',
                border: errors.username
                  ? '1.5px solid var(--danger)'
                  : '1.5px solid var(--border)',
                color: 'var(--ink)',
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = errors.username
                  ? 'var(--danger)'
                  : 'var(--accent)')
              }
              onBlur={(e) =>
                (e.target.style.borderColor = errors.username
                  ? 'var(--danger)'
                  : 'var(--border)')
              }
            />
            {errors.username && (
              <p className="text-xs" style={{ color: 'var(--danger-text)' }}>
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium"
              style={{ color: 'var(--ink)' }}
              htmlFor="password"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                className="w-full px-3 py-2 pr-10 text-sm rounded-lg outline-none transition-colors"
                style={{
                  background: 'var(--background)',
                  border: errors.password
                    ? '1.5px solid var(--danger)'
                    : '1.5px solid var(--border)',
                  color: 'var(--ink)',
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = errors.password
                    ? 'var(--danger)'
                    : 'var(--accent)')
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = errors.password
                    ? 'var(--danger)'
                    : 'var(--border)')
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--ink-faint)' }}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs" style={{ color: 'var(--danger-text)' }}>
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 text-sm font-medium text-white rounded-lg flex items-center justify-center gap-2 transition-opacity"
            style={{ background: 'var(--accent)', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
