import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './componentes/Layout';
import RotaProtegida from './componentes/RotaProtegida';
import AlunoForm from './paginas/AlunoForm';
import Disciplinas from './paginas/Disciplinas';
import Alunos from './paginas/Alunos';
import Inicio from './paginas/Inicio';
import Login from './paginas/Login';
import MatriculaDetalhe from './paginas/MatriculaDetalhe';
import Notificacoes from './paginas/Notificacoes';
import ProfessorForm from './paginas/ProfessorForm';
import Professores from './paginas/Professores';
import TurmaDetalhe from './paginas/TurmaDetalhe';
import Turmas from './paginas/Turmas';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/alunos" element={<Alunos />} />
          {/* The static "novo" wins over ":id" in React Router's ranking */}
          <Route path="/alunos/novo" element={<AlunoForm />} />
          <Route path="/alunos/:id" element={<AlunoForm />} />
          <Route path="/professores" element={<Professores />} />
          <Route path="/professores/novo" element={<ProfessorForm />} />
          <Route path="/professores/:id" element={<ProfessorForm />} />
          <Route path="/disciplinas" element={<Disciplinas />} />
          <Route path="/turmas" element={<Turmas />} />
          <Route path="/turmas/:id" element={<TurmaDetalhe />} />
          <Route path="/matriculas/:id" element={<MatriculaDetalhe />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
