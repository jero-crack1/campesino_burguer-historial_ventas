import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, ShieldCheck, UserRound } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import FieldError from '@/components/FieldError';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  username: z.string().min(1, 'Usuario requerido'),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'MESERO'], { errorMap: () => ({ message: 'Selecciona un rol' }) }),
  activo: z.boolean().optional(),
});

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/usuarios');
      setItems(data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setSelected(null);
    reset({ nombre: '', username: '', password: '', role: 'MESERO', activo: true });
    setError(''); setFormOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    reset({ nombre: row.nombre, username: row.username, password: '', role: row.role, activo: row.activo });
    setError(''); setFormOpen(true);
  };

  const onSubmit = async (values) => {
    setSaving(true); setError('');
    try {
      const payload = { nombre: values.nombre, username: values.username, role: values.role };
      if (values.password) payload.password = values.password;
      if (selected) {
        payload.activo = values.activo;
        await api.put(`/usuarios/${selected.id}`, payload);
        toast.success(`"${values.nombre}" actualizado`);
      } else {
        if (!values.password) { setError('La contraseña es requerida'); setSaving(false); return; }
        await api.post('/usuarios', payload);
        toast.success(`"${values.nombre}" creado`);
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'username', label: 'Usuario' },
    {
      key: 'role', label: 'Rol',
      render: (r) => r.role === 'ADMIN'
        ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}><ShieldCheck className="w-3 h-3" /> Administrador</span>
        : <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--ink-muted)' }}><UserRound className="w-3 h-3" /> Mesero</span>,
    },
    {
      key: 'activo', label: 'Estado',
      render: (r) => r.activo
        ? <Badge variant="success">Activo</Badge>
        : <Badge variant="secondary">Inactivo</Badge>,
    },
    {
      key: 'actions', label: '', width: 60,
      render: (r) => (
        <span className="flex items-center justify-end">
          <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Cuentas de acceso al sistema y sus roles"
        action={<Button onClick={openCreate}><Plus className="w-4 h-4" />Nuevo usuario</Button>}
      />

      <DataTable columns={columns} data={items} loading={loading} emptyTitle="Sin usuarios" emptyDescription="Crea la primera cuenta de acceso." />

      <FormModal open={formOpen} onOpenChange={setFormOpen} title={selected ? 'Editar usuario' : 'Nuevo usuario'} onSubmit={handleSubmit(onSubmit)} loading={saving}>
        <div className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input className="mt-1" {...register('nombre')} />
            <FieldError message={errors.nombre?.message} />
          </div>
          <div>
            <Label>Usuario *</Label>
            <Input className="mt-1" autoComplete="off" {...register('username')} />
            <FieldError message={errors.username?.message} />
          </div>
          <div>
            <Label>Contraseña {selected ? <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(dejar en blanco para no cambiarla)</span> : '*'}</Label>
            <Input type="password" className="mt-1" autoComplete="new-password" {...register('password')} />
            <FieldError message={errors.password?.message} />
          </div>
          <div>
            <Label>Rol *</Label>
            <Controller name="role" control={control} render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="MESERO">Mesero</SelectItem>
                </SelectContent>
              </Select>
            )} />
            <FieldError message={errors.role?.message} />
          </div>
          {selected && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" disabled={selected.id === currentUser?.id} {...register('activo')} />
              Cuenta activa
              {selected.id === currentUser?.id && (
                <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>(no puedes desactivar tu propia cuenta)</span>
              )}
            </label>
          )}
        </div>
        {error && <p className="text-sm text-[var(--danger-text)] mt-2">{error}</p>}
      </FormModal>
    </>
  );
}
