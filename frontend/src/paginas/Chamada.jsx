import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { buscarTurma, listarChamada, listarMatriculas, listarTodosAlunos, registrarChamada } from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import DialogLancamento from '../componentes/DialogLancamento';
import { useAuth } from '../contexto/AuthContext';
import useCarregamento from '../hooks/useCarregamento';
import { NOMES_TURNO, SITUACOES, formatarData, hojeIso } from '../utils/formatos';
import { podeLancarNotasEFrequencia } from '../utils/permissoes';

const PLURAIS = { PRESENTE: ['presente', 'presentes'], ATRASO: ['atraso', 'atrasos'], FALTA: ['falta', 'faltas'] };

// Daily roll call of a whole class in one screen. Days already registered show as read-only,
// because attendance cannot be edited or deleted after it is saved.
export default function Chamada() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const permitido = podeLancarNotasEFrequencia(usuario.perfil);
  const [data, setData] = useState(hojeIso());

  const turma = useCarregamento(() => buscarTurma(id), [id]);
  const matriculas = useCarregamento(() => listarMatriculas({ turma_id: id }), [id]);
  const alunos = useCarregamento(listarTodosAlunos, []);
  const doDia = useCarregamento(() => (data ? listarChamada(id, data) : Promise.resolve([])), [id, data]);

  // Situation chosen on screen for each enrollment not yet registered (default: present)
  const [escolhas, setEscolhas] = useState({});
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const [resultado, setResultado] = useState(null);

  const alunosPorId = useMemo(() => new Map((alunos.dados ?? []).map((a) => [a.id, a])), [alunos.dados]);
  const registradas = useMemo(
    () => new Map((doDia.dados ?? []).map((f) => [f.matricula_id, f.situacao])),
    [doDia.dados]
  );

  const linhas = useMemo(
    () =>
      (matriculas.dados ?? [])
        .map((matricula) => ({ matricula, aluno: alunosPorId.get(matricula.aluno_id) }))
        .sort((a, b) => (a.aluno?.nome ?? '~').localeCompare(b.aluno?.nome ?? '~')),
    [matriculas.dados, alunosPorId]
  );
  const pendentes = linhas.filter((linha) => !registradas.has(linha.matricula.id));
  const situacaoDe = (matriculaId) => escolhas[matriculaId] ?? 'PRESENTE';

  function trocarData(novaData) {
    setData(novaData);
    setEscolhas({});
    setResultado(null);
    setErroEnvio(null);
  }

  function marcarTodos(situacao) {
    setEscolhas(Object.fromEntries(pendentes.map((linha) => [linha.matricula.id, situacao])));
  }

  async function salvar() {
    setEnviando(true);
    setErroEnvio(null);
    try {
      const registros = pendentes.map((linha) => ({
        matricula_id: linha.matricula.id,
        situacao: situacaoDe(linha.matricula.id),
      }));
      const resposta = await registrarChamada(Number(id), data, registros);
      setResultado(resposta);
      setConfirmando(false);
      setEscolhas({});
    } catch (erro) {
      // The roll call skips what is already saved, so after a timeout it is safe to send it again
      setErroEnvio(erro);
    } finally {
      setEnviando(false);
      doDia.recarregar();
    }
  }

  const contagem = Object.keys(SITUACOES).map((situacao) => ({
    situacao,
    total: pendentes.filter((linha) => situacaoDe(linha.matricula.id) === situacao).length,
  }));
  const textoResumo =
    `Registrar a chamada de ${data ? formatarData(data) : '?'}: ` +
    contagem.map(({ situacao, total }) => `${total} ${PLURAIS[situacao][total === 1 ? 0 : 1]}`).join(', ') +
    '?';

  const voltar = (
    <Button component={Link} to={`/turmas/${id}`} sx={{ mb: 2 }}>
      ← Voltar para a turma
    </Button>
  );

  if (!permitido) {
    return (
      <>
        {voltar}
        <Alert severity="warning">Sem permissão para fazer chamada</Alert>
      </>
    );
  }

  return (
    <>
      {voltar}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Chamada ·{' '}
        {turma.dados
          ? `${turma.dados.nome} · ${turma.dados.ano_letivo} · ${NOMES_TURNO[turma.dados.turno] ?? ''}`
          : `Turma #${id}`}
      </Typography>
      <AlertaErro erro={turma.erro} />
      <AlertaErro erro={matriculas.erro} />
      {alunos.erro && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Os nomes dos alunos não carregaram ({alunos.erro.message}). A chamada continua funcionando pelo número da
          matrícula.
        </Alert>
      )}

      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
        <TextField
          label="Data"
          type="date"
          size="small"
          value={data}
          onChange={(e) => trocarData(e.target.value)}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hojeIso() } }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" onClick={() => marcarTodos('PRESENTE')} disabled={pendentes.length === 0}>
          Todos presentes
        </Button>
        <Button size="small" onClick={() => marcarTodos('FALTA')} disabled={pendentes.length === 0}>
          Todos com falta
        </Button>
      </Stack>

      {resultado && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Chamada salva: {resultado.registradas.length} registro(s).
          {resultado.ja_registradas.length > 0 &&
            ` ${resultado.ja_registradas.length} aluno(s) já tinham registro neste dia e não foram alterados.`}
        </Alert>
      )}
      <AlertaErro erro={doDia.erro} />

      <Paper>
        <Box sx={{ height: 4 }}>
          {(matriculas.carregando || alunos.carregando || doDia.carregando) && <LinearProgress />}
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Aluno</TableCell>
                <TableCell>Situação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {linhas.map(({ matricula, aluno }) => {
                const salva = registradas.get(matricula.id);
                return (
                  <TableRow key={matricula.id} hover>
                    <TableCell>{aluno ? `${aluno.nome} (${aluno.matricula})` : `Matrícula #${matricula.id}`}</TableCell>
                    <TableCell>
                      {salva ? (
                        <Chip
                          size="small"
                          color={SITUACOES[salva].cor}
                          label={`${SITUACOES[salva].rotulo} (já registrado)`}
                        />
                      ) : (
                        <ToggleButtonGroup
                          size="small"
                          exclusive
                          value={situacaoDe(matricula.id)}
                          onChange={(_, valor) =>
                            valor && setEscolhas((atuais) => ({ ...atuais, [matricula.id]: valor }))
                          }
                          disabled={enviando}
                        >
                          {Object.entries(SITUACOES).map(([valor, { rotulo, cor }]) => (
                            <ToggleButton key={valor} value={valor} color={cor}>
                              {rotulo}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!matriculas.carregando && linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhum aluno matriculado nesta turma
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Stack direction="row" sx={{ mt: 2, alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={() => {
            setErroEnvio(null);
            setConfirmando(true);
          }}
          disabled={!data || pendentes.length === 0 || doDia.carregando || Boolean(doDia.erro)}
        >
          Salvar chamada
        </Button>
        {linhas.length > 0 && pendentes.length === 0 && !doDia.carregando && (
          <Typography color="text.secondary">A chamada deste dia já foi feita.</Typography>
        )}
      </Stack>

      {/* Opens straight on the summary step: the choices were already made in the table */}
      <DialogLancamento
        aberto={confirmando}
        titulo="Salvar chamada"
        confirmando
        resumo={textoResumo}
        erro={erroEnvio}
        enviando={enviando}
        aoFechar={() => setConfirmando(false)}
        aoVoltar={() => setConfirmando(false)}
        aoConfirmar={salvar}
      />
    </>
  );
}
