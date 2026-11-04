import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './componentes/Layout';
import RotaProtegida from './componentes/RotaProtegida';
import Alunos from './paginas/Alunos';
import Inicio from './paginas/Inicio';
import Login from './paginas/Login';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/alunos" element={<Alunos />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
