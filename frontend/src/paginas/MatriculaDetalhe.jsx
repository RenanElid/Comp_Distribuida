import { useMemo } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ErroApi } from '../api/cliente';
import {
  buscarAluno,
  buscarTurma,
  listarAtribuicoesDaTurma,
  listarDisciplinas,
  listarFrequencias,
  listarMatriculas,
  listarNotas,
} from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import FrequenciaDaMatricula from '../componentes/FrequenciaDaMatricula';
import NotasDaMatricula from '../componentes/NotasDaMatricula';
import { useAuth } from '../contexto/AuthContext';
import useCarregamento from '../hooks/useCarregamento';
import { podeLancarNotasEFrequencia } from '../utils/permissoes';

// There is no GET /matriculas/{id}. The class page sends the enrollment in the link state;
// without it (URL typed by hand, new tab) we search the full list: 1 request that grows with the school.
async function buscarMatricula(id, matriculaDoLink) {
  if (matriculaDoLink && String(matriculaDoLink.id) === id) return matriculaDoLink;
  const todas = await listarMatriculas({});
  const encontrada = todas.find((m) => String(m.id) === id);
  if (!encontrada) throw new ErroApi(404, 'Matrícula não encontrada');
  return encontrada;
}

// Lets the dependent loads wait until the enrollment (and its ids) is known
function seExistir(valor, carregar) {
  return valor ? carregar(valor) : Promise.resolve(null);
}

export default function MatriculaDetalhe() {
  const { id } = useParams();
  const local = useLocation();
  const { usuario } = useAuth();
  const podeLancar = podeLancarNotasEFrequencia(usuario.perfil);

  const matricula = useCarregamento(() => buscarMatricula(id, local.state?.matricula), [id]);
  const alunoId = matricula.dados?.aluno_id;
  const turmaId = matricula.dados?.turma_id;

  // Independent loads: grades and attendance only need the academico-service,
  // so they keep working when alunos-service or administrativo-service are down
  const aluno = useCarregamento(() => seExistir(alunoId, buscarAluno), [alunoId]);
  const turma = useCarregamento(() => seExistir(turmaId, buscarTurma), [turmaId]);
  const atribuicoes = useCarregamento(() => seExistir(turmaId, listarAtribuicoesDaTurma), [turmaId]);
  const disciplinas = useCarregamento(listarDisciplinas, []);
  const notas = useCarregamento(() => listarNotas(id), [id]);
  const frequencias = useCarregamento(() => listarFrequencias(id), [id]);

  const nomesDisciplinas = useMemo(
    () => new Map((disciplinas.dados ?? []).map((d) => [d.id, d.nome])),
    [disciplinas.dados]
  );
  const disciplinasDaTurma = useMemo(
    () =>
      (atribuicoes.dados ?? [])
        .map((a) => ({ id: a.disciplina_id, nome: nomesDisciplinas.get(a.disciplina_id) ?? `Disciplina #${a.disciplina_id}` }))
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [atribuicoes.dados, nomesDisciplinas]
  );

  const motivoSemDisciplinas = atribuicoes.erro
    ? 'As disciplinas da turma não carregaram'
    : atribuicoes.carregando || !atribuicoes.dados
      ? 'Carregando disciplinas...'
      : disciplinasDaTurma.length === 0
        ? 'A turma não tem disciplinas atribuídas'
        : null;

  // Back to the class keeping its own state (the year filter of /turmas)
  const voltarPara = local.state?.voltarParaTurma ?? (turmaId ? `/turmas/${turmaId}` : '/turmas');
  const botaoVoltar = (
    <Button component={Link} to={voltarPara} state={local.state?.estadoDaTurma} sx={{ mb: 2 }}>
      ← Voltar para a turma
    </Button>
  );

  // 422 means a non-numeric id in the URL, e.g. /matriculas/abc
  const naoEncontrada = [matricula.erro, notas.erro].some((e) => e?.status === 404 || e?.status === 422);
  if (naoEncontrada) {
    return (
      <>
        {botaoVoltar}
        <Alert severity="info">Matrícula não encontrada</Alert>
      </>
    );
  }
  if (matricula.carregando && !matricula.dados) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const nomeAluno = aluno.dados ? aluno.dados.nome : `Aluno #${alunoId ?? '?'}`;
  const descricaoAluno = aluno.dados ? `${aluno.dados.nome} (${aluno.dados.matricula})` : nomeAluno;
  const descricaoTurma = turma.dados ? `${turma.dados.nome} · ${turma.dados.ano_letivo}` : `Turma #${turmaId ?? '?'}`;
  const falhas = [
    aluno.erro && `aluno (${aluno.erro.message})`,
    turma.erro && `turma (${turma.erro.message})`,
    (atribuicoes.erro || disciplinas.erro) &&
      `disciplinas (${(atribuicoes.erro ?? disciplinas.erro).message})`,
  ].filter(Boolean);

  return (
    <>
      {botaoVoltar}

      <Typography variant="h5" sx={{ mb: 2 }}>
        {descricaoAluno} · {descricaoTurma}
      </Typography>

      {/* matricula.erro here is not a 404 (handled above): e.g. academico-service down */}
      <AlertaErro erro={matricula.erro} />

      {falhas.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Não foi possível carregar: {falhas.join(', ')}. Notas e frequências continuam disponíveis.
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Notas e frequências não podem ser editadas nem excluídas depois de lançadas. Confira o resumo antes de
        confirmar.
      </Alert>

      <NotasDaMatricula
        matriculaId={id}
        notas={notas}
        disciplinasDaTurma={disciplinasDaTurma}
        nomesDisciplinas={nomesDisciplinas}
        motivoSemDisciplinas={motivoSemDisciplinas}
        nomeAluno={nomeAluno}
        podeLancar={podeLancar}
      />

      <FrequenciaDaMatricula
        matriculaId={id}
        frequencias={frequencias}
        nomeAluno={nomeAluno}
        podeLancar={podeLancar}
      />
    </>
  );
}
