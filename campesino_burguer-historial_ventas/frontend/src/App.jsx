import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import MateriasPrimasPage from '@/pages/MateriasPrimas/MateriasPrimasPage';
import ComprasPage from '@/pages/Compras/ComprasPage';
import SubRecetasPage from '@/pages/SubRecetas/SubRecetasPage';
import RecetasPage from '@/pages/Recetas/RecetasPage';
import ProduccionSubRecetasPage from '@/pages/ProduccionSubRecetas/ProduccionSubRecetasPage';
import ProduccionRecetasPage from '@/pages/ProduccionRecetas/ProduccionRecetasPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/materias-primas" replace />} />
        <Route path="materias-primas" element={<MateriasPrimasPage />} />
        <Route path="compras" element={<ComprasPage />} />
        <Route path="sub-recetas" element={<SubRecetasPage />} />
        <Route path="recetas" element={<RecetasPage />} />
        <Route path="produccion/sub-recetas" element={<ProduccionSubRecetasPage />} />
        <Route path="produccion/recetas" element={<ProduccionRecetasPage />} />
      </Route>
    </Routes>
  );
}
