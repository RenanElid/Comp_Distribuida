import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  MenuItem,
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
import {
  atribuirProfessor,
  listarAtribuicoesDaTurma,
  listarDisciplinas,
  listarProfessores,
  removerAtribuicao,
} from '../api/endpoints';
import useCarregamento from '../hooks/useCarregamento';
import AlertaErro from './AlertaErro';

// "Who teaches what" in a class. Three independent loads: a missing name shows as "#id".
export default function AtribuicoesDaTurma({ turmaId, podeEditar }) {
  const atribuicoes = useCarregamento(() => listarAtribuicoesDaTurma(turmaId), [turmaId]);
  const disciplinas = useCarregamento(listarDisciplinas, []);
  const professores = useCarregamento(listarProfessores, []);

  const [dialogAberto, setDialogAberto] = useState(false);
  const [escolha, setEscolha] = useState({ disciplina_id: '', professor_id: '' });
  const [aRemover, setARemover] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erroDialog, setErroDialog] = useState(null);

  const disciplinasPorId = useMemo(
    () => new Map((disciplinas.dados ?? []).map((d) => [d.id, d])),
    [disciplinas.dados]
  );
  const professoresPorId = useMemo(
    () => new Map((professores.dados ?? []).map((p) => [p.id, p])),
    [professores.dados]
  );

  const linhas = useMemo(
    () =>
      [...(atribuicoes.dados ?? [])].sort((a, b) =>
        (disciplinasPorId.get(a.disciplina_id)?.nome ?? '').localeCompare(
          disciplinasPorId.get(b.disciplina_id)?.nome ?? ''
        )
      ),
    [atribuicoes.dados, disciplinasPorId]
  );

  // The backend allows one teacher per subject in a class, so assigned subjects leave the list
  const disciplinasLivres = useMemo(() => {
    const ocupadas = new Set((atribuicoes.dados ?? []).map((a) => a.disciplina_id));
    return (disciplinas.dados ?? []).filter((d) => !ocupadas.has(d.id));
  }, [disciplinas.dados, atribuicoes.dados]);

  const nomeDisciplina = (id) => disciplinasPorId.get(id)?.nome ?? `Disciplina #${id}`;
  const nomeProfessor = (id) => professoresPorId.get(id)?.nome ?? `Professor #${id}`;

  const motivoSemAtribuir =
    disciplinas.erro || professores.erro
      ? 'As disciplinas ou os professores não carregaram'
      : disciplinas.carregando || professores.carregando
        ? 'Carregando...'
        : disciplinasLivres.length === 0
          ? 'Todas as disciplinas já têm professor nesta turma'
          : (professores.dados ?? []).length === 0
            ? 'Nenhum professor cadastrado'
            : null;

  function abrirAtribuir() {
    setEscolha({ disciplina_id: '', professor_id: '' });
    setErroDialog(null);
    setDialogAberto(true);
  }

  async function confirmarAtribuicao() {
    setEnviando(true);
    setErroDialog(null);
    try {
      await atribuirProfessor(turmaId, escolha.disciplina_id, escolha.professor_id);
      setDialogAberto(false);
    } catch (erro) {
      setErroDialog(erro);
    } finally {
      setEnviando(false);
      atribuicoes.recarregar();
    }
  }

  async function confirmarRemocao() {
    setEnviando(true);
    setErroDialog(null);
    try {
      await removerAtribuicao(turmaId, aRemover.id);
      setARemover(null);
    } catch (erro) {
      setErroDialog(erro);
    } finally {
      setEnviando(false);
      atribuicoes.recarregar();
    }
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
        <Typography variant="h6">Professores e disciplinas</Typography>
        {podeEditar && (
          <Tooltip title={motivoSemAtribuir ?? ''}>
            <span>
              <Button variant="outlined" onClick={abrirAtribuir} disabled={Boolean(motivoSemAtribuir)}>
                + Atribuir professor
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>

      <AlertaErro erro={atribuicoes.erro} />

      <Paper>
        <Box sx={{ height: 4 }}>{atribuicoes.carregando && <LinearProgress />}</Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Disciplina</TableCell>
                <TableCell>Professor</TableCell>
                {podeEditar && <TableCell align="right">Ações</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {linhas.map((atribuicao) => (
                <TableRow key={atribuicao.id} hover>
                  <TableCell>{nomeDisciplina(atribuicao.disciplina_id)}</TableCell>
                  <TableCell>{nomeProfessor(atribuicao.professor_id)}</TableCell>
                  {podeEditar && (
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          setErroDialog(null);
                          setARemover(atribuicao);
                        }}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {!atribuicoes.carregando && !atribuicoes.erro && linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={podeEditar ? 3 : 2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    Nenhum professor atribuído nesta turma
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogAberto} onClose={() => !enviando && setDialogAberto(false)} fullWidth maxWidth="xs">
        <DialogTitle>Atribuir professor</DialogTitle>
        <DialogContent>
          <AlertaErro erro={erroDialog} sx={{ mt: 1 }} />
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Disciplina"
              value={escolha.disciplina_id}
              onChange={(e) => setEscolha((atual) => ({ ...atual, disciplina_id: e.target.value }))}
              disabled={enviando}
            >
              {disciplinasLivres.map((disciplina) => (
                <MenuItem key={disciplina.id} value={disciplina.id}>
                  {disciplina.nome}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Professor"
              value={escolha.professor_id}
              onChange={(e) => setEscolha((atual) => ({ ...atual, professor_id: e.target.value }))}
              disabled={enviando}
              helperText="O professor recebe uma notificação da atribuição"
            >
              {(professores.dados ?? []).map((professor) => (
                <MenuItem key={professor.id} value={professor.id}>
                  {professor.nome}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={confirmarAtribuicao}
            disabled={enviando || escolha.disciplina_id === '' || escolha.professor_id === ''}
          >
            {enviando ? 'Salvando...' : 'Atribuir'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(aRemover)} onClose={() => !enviando && setARemover(null)}>
        <DialogTitle>Remover atribuição?</DialogTitle>
        <DialogContent>
          <AlertaErro erro={erroDialog} />
          <DialogContentText>
            {aRemover && `${nomeProfessor(aRemover.professor_id)} deixará de dar ${nomeDisciplina(aRemover.disciplina_id)} nesta turma.`}{' '}
            As notas já lançadas nesta disciplina continuam.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setARemover(null)} disabled={enviando}>
            Voltar
          </Button>
          <Button color="error" variant="contained" onClick={confirmarRemocao} disabled={enviando}>
            {enviando ? 'Removendo...' : 'Remover'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
