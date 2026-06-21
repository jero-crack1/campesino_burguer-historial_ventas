import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/Login/LoginPage';
import MateriasPrimasPage from '@/pages/MateriasPrimas/MateriasPrimasPage';
import ComprasPage from '@/pages/Compras/ComprasPage';
import SubRecetasPage from '@/pages/SubRecetas/SubRecetasPage';
import RecetasPage from '@/pages/Recetas/RecetasPage';
import ProduccionSubRecetasPage from '@/pages/ProduccionSubRecetas/ProduccionSubRecetasPage';
import ProduccionRecetasPage from '@/pages/ProduccionRecetas/ProduccionRecetasPage';
import VentasPage from '@/pages/Ventas/VentasPage';
import HistorialPage from '@/pages/Historial/HistorialPage';
import ReportesPage from '@/pages/Reportes/ReportesPage';
import FacturaPage from '@/pages/Factura/FacturaPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        {/* Factura: sin sidebar */}
        <Route path="/factura/:id" element={<FacturaPage />} />

        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/materias-primas" replace />} />
          <Route path="materias-primas" element={<MateriasPrimasPage />} />
          <Route path="compras" element={<ComprasPage />} />
          <Route path="sub-recetas" element={<SubRecetasPage />} />
          <Route path="recetas" element={<RecetasPage />} />
          <Route path="produccion/sub-recetas" element={<ProduccionSubRecetasPage />} />
          <Route path="produccion/recetas" element={<ProduccionRecetasPage />} />
          <Route path="ventas" element={<VentasPage />} />
          <Route path="historial" element={<HistorialPage />} />
          <Route path="reportes" element={<ReportesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
