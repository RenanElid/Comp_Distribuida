import { useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Link as LinkMui,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  buscarTurma,
  cancelarMatricula,
  listarMatriculas,
  listarTodosAlunos,
  matricularAluno,
} from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import { useAuth } from '../contexto/AuthContext';
import useCarregamento from '../hooks/useCarregamento';
import { podeGerenciarMatriculas } from '../utils/permissoes';
import { NOMES_TURNO } from './Turmas';

function descreverAluno(aluno) {
  return `${aluno.nome} (${aluno.matricula})`;
}

// The link state carries the enrollment (there is no GET /matriculas/{id}) and how to come back here
function LinhaMatricula({ linha, podeGerenciar, aoCancelar, estadoDaTurma }) {
  const { aluno, matricula } = linha;
  const estadoDoLink = { matricula, voltarParaTurma: `/turmas/${matricula.turma_id}`, estadoDaTurma };
  return (
    <TableRow hover>
      <TableCell>{aluno?.matricula ?? '-'}</TableCell>
      <TableCell>
        <LinkMui component={Link} to={`/matriculas/${matricula.id}`} state={estadoDoLink}>
          {/* No student found: either the alunos-service is down or the student was just deleted
              and the student.deleted event has not removed this enrollment yet */}
          {aluno ? aluno.nome : `Aluno #${matricula.aluno_id} (não encontrado)`}
        </LinkMui>
      </TableCell>
      {podeGerenciar && (
        <TableCell align="right">
          <Button size="small" color="error" onClick={() => aoCancelar(linha)}>
            Cancelar
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}

export default function TurmaDetalhe() {
  const { id } = useParams();
  const local = useLocation();
  const voltarPara = '/turmas' + (local.state?.voltarPara ?? '');
  const { usuario } = useAuth();
  const podeGerenciar = podeGerenciarMatriculas(usuario.perfil);

  // Three independent loads: if one service is down, the others still show up
  const turma = useCarregamento(() => buscarTurma(id), [id]);
  const matriculas = useCarregamento(() => listarMatriculas({ turma_id: id }), [id]);
  const alunos = useCarregamento(listarTodosAlunos, []);

  const [dialogMatricular, setDialogMatricular] = useState(false);
  const [alunoEscolhido, setAlunoEscolhido] = useState(null);
  const [linhaACancelar, setLinhaACancelar] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erroDialog, setErroDialog] = useState(null);

  const alunosPorId = useMemo(() => new Map((alunos.dados ?? []).map((a) => [a.id, a])), [alunos.dados]);

  // Sorted by name; enrollments without a known student go to the end
  const linhas = useMemo(
    () =>
      (matriculas.dados ?? [])
        .map((matricula) => ({ matricula, aluno: alunosPorId.get(matricula.aluno_id) }))
        .sort((a, b) => {
          if (!a.aluno || !b.aluno) return Number(!a.aluno) - Number(!b.aluno) || a.matricula.id - b.matricula.id;
          return a.aluno.nome.localeCompare(b.aluno.nome);
        }),
    [matriculas.dados, alunosPorId]
  );

  const alunosDisponiveis = useMemo(() => {
    const jaMatriculados = new Set((matriculas.dados ?? []).map((m) => m.aluno_id));
    return (alunos.dados ?? []).filter((aluno) => !jaMatriculados.has(aluno.id));
  }, [alunos.dados, matriculas.dados]);

  function abrirMatricular() {
    setAlunoEscolhido(null);
    setErroDialog(null);
    setDialogMatricular(true);
  }

  function abrirCancelar(linha) {
    setErroDialog(null);
    setLinhaACancelar(linha);
  }

  async function confirmarMatricula() {
    setEnviando(true);
    setErroDialog(null);
    try {
      await matricularAluno(alunoEscolhido.id, Number(id));
      setDialogMatricular(false);
    } catch (erro) {
      setErroDialog(erro);
      // 409: someone else enrolled this student meanwhile; the reload below drops them from the options
      if (erro.status === 409) setAlunoEscolhido(null);
    } finally {
      setEnviando(false);
      matriculas.recarregar();
    }
  }

  async function confirmarCancelamento() {
    setEnviando(true);
    setErroDialog(null);
    try {
      await cancelarMatricula(linhaACancelar.matricula.id);
      setLinhaACancelar(null);
    } catch (erro) {
      setErroDialog(erro);
    } finally {
      setEnviando(false);
      matriculas.recarregar();
    }
  }

  const botaoVoltar = (
    <Button component={Link} to={voltarPara} sx={{ mb: 2 }}>
      ← Voltar para turmas
    </Button>
  );

  // 422 here means a non-numeric id in the URL, e.g. /turmas/abc
  if (turma.erro?.status === 404 || turma.erro?.status === 422) {
    return (
      <>
        {botaoVoltar}
        <Alert severity="info">Turma não encontrada</Alert>
      </>
    );
  }
  if (turma.carregando && !turma.dados) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const motivoSemMatricula = alunos.erro
    ? 'A lista de alunos não carregou'
    : alunos.carregando
      ? 'Carregando alunos...'
      : alunosDisponiveis.length === 0
        ? 'Todos os alunos já estão nesta turma'
        : null;

  return (
    <>
      {botaoVoltar}

      {turma.dados ? (
        <Typography variant="h5" sx={{ mb: 2 }}>
          {turma.dados.nome} · {turma.dados.ano_letivo} · {NOMES_TURNO[turma.dados.turno] ?? turma.dados.turno}
        </Typography>
      ) : (
        <>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Turma #{id}
          </Typography>
          <AlertaErro erro={turma.erro} />
        </>
      )}

      {alunos.erro && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Os nomes dos alunos não puderam ser carregados ({alunos.erro.message}). As matrículas continuam visíveis.
        </Alert>
      )}

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">
          Alunos matriculados{matriculas.dados ? ` (${matriculas.dados.length})` : ''}
        </Typography>
        {podeGerenciar && (
          // Disabled buttons do not fire mouse events, so the tooltip needs the span around it
          <Tooltip title={motivoSemMatricula ?? ''}>
            <span>
              <Button variant="contained" onClick={abrirMatricular} disabled={Boolean(motivoSemMatricula)}>
                + Matricular aluno
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>

      <AlertaErro erro={matriculas.erro} />

      <Paper>
        <Box sx={{ height: 4 }}>{(matriculas.carregando || alunos.carregando) && <LinearProgress />}</Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Matrícula</TableCell>
                <TableCell>Nome</TableCell>
                {podeGerenciar && <TableCell align="right">Ações</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {linhas.map((linha) => (
                <LinhaMatricula
                  key={linha.matricula.id}
                  linha={linha}
                  podeGerenciar={podeGerenciar}
                  aoCancelar={abrirCancelar}
                  estadoDaTurma={local.state}
                />
              ))}
              {!matriculas.carregando && !matriculas.erro && linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={podeGerenciar ? 3 : 2} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhum aluno matriculado nesta turma
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={dialogMatricular}
        onClose={() => !enviando && setDialogMatricular(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Matricular aluno</DialogTitle>
        <DialogContent>
          <AlertaErro erro={erroDialog} sx={{ mt: 1 }} />
          <Autocomplete
            options={alunosDisponiveis}
            getOptionLabel={descreverAluno}
            isOptionEqualToValue={(opcao, valor) => opcao.id === valor.id}
            value={alunoEscolhido}
            onChange={(_, valor) => setAlunoEscolhido(valor)}
            noOptionsText="Nenhum aluno encontrado"
            disabled={enviando}
            renderInput={(params) => (
              <TextField {...params} label="Aluno" placeholder="Digite o nome ou a matrícula" sx={{ mt: 1 }} />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogMatricular(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={confirmarMatricula} disabled={!alunoEscolhido || enviando}>
            {enviando ? 'Matriculando...' : 'Matricular'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(linhaACancelar)} onClose={() => !enviando && setLinhaACancelar(null)}>
        <DialogTitle>Cancelar matrícula?</DialogTitle>
        <DialogContent>
          <AlertaErro erro={erroDialog} />
          <DialogContentText>
            {linhaACancelar?.aluno ? linhaACancelar.aluno.nome : `Aluno #${linhaACancelar?.matricula.aluno_id}`} sairá
            da turma, e as notas e frequências desta matrícula serão apagadas. Essa ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinhaACancelar(null)} disabled={enviando}>
            Voltar
          </Button>
          <Button color="error" variant="contained" onClick={confirmarCancelamento} disabled={enviando}>
            {enviando ? 'Cancelando...' : 'Cancelar matrícula'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
