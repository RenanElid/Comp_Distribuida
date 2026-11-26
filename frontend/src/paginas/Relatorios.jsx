import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import {
  listarAtribuicoesDaTurma,
  listarDisciplinas,
  listarProfessores,
  listarTodosAlunos,
  listarTurmas,
  resumoFrequenciaDaTurma,
  resumoNotasDaTurma,
} from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import BotoesExportar from '../componentes/BotoesExportar';
import useCarregamento from '../hooks/useCarregamento';
import { NOMES_TURNO, PRESENCA_MINIMA, calcularMedia, formatarNumero, formatarPercentual } from '../utils/formatos';

const vazio = () => Promise.resolve([]);

function nomeDaTurma(turma) {
  return `${turma.nome} · ${turma.ano_letivo} · ${NOMES_TURNO[turma.turno] ?? turma.turno}`;
}

function RelatorioFrequencia({ linhas, carregando, erro, titulo, turmaId }) {
  const [erroExportacao, setErroExportacao] = useState(null);
  const colunas = [
    { titulo: 'Aluno', valor: (l) => l.nome },
    { titulo: 'Dias registrados', valor: (l) => l.total },
    { titulo: 'Presenças', valor: (l) => l.presentes },
    { titulo: 'Atrasos', valor: (l) => l.atrasos },
    { titulo: 'Faltas', valor: (l) => l.faltas },
    { titulo: 'Presença', valor: (l) => formatarPercentual(l.percentual) },
  ];
  const abaixoDoMinimo = linhas.filter((l) => l.percentual != null && l.percentual < PRESENCA_MINIMA).length;

  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Frequência
        </Typography>
        <BotoesExportar
          nomeArquivo={`frequencia-turma-${turmaId}`}
          titulo={`Frequência · ${titulo}`}
          colunas={colunas}
          carregarLinhas={async () => linhas}
          aoErro={setErroExportacao}
        />
      </Stack>
      <AlertaErro erro={erro} />
      <AlertaErro erro={erroExportacao} />
      {abaixoDoMinimo > 0 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {abaixoDoMinimo} aluno(s) com presença abaixo de {PRESENCA_MINIMA}%.
        </Alert>
      )}
      <Paper>
        <Box sx={{ height: 4 }}>{carregando && <LinearProgress />}</Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {colunas.map((coluna) => (
                  <TableCell key={coluna.titulo} align={coluna.titulo === 'Aluno' ? 'left' : 'right'}>
                    {coluna.titulo}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.matricula_id} hover>
                  <TableCell>{l.nome}</TableCell>
                  <TableCell align="right">{l.total}</TableCell>
                  <TableCell align="right">{l.presentes}</TableCell>
                  <TableCell align="right">{l.atrasos}</TableCell>
                  <TableCell align="right">{l.faltas}</TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      label={formatarPercentual(l.percentual)}
                      color={l.percentual == null ? 'default' : l.percentual < PRESENCA_MINIMA ? 'error' : 'success'}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
              {!carregando && !erro && linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    Nenhum aluno matriculado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Typography variant="caption" color="text.secondary">
        Presença = (presenças + atrasos) ÷ dias registrados. O atraso conta como presença.
      </Typography>
    </Box>
  );
}

function RelatorioNotas({ linhas, disciplinas, carregando, erro, titulo, turmaId }) {
  const [erroExportacao, setErroExportacao] = useState(null);
  const colunas = [
    { titulo: 'Aluno', valor: (l) => l.nome },
    ...disciplinas.map((d) => ({
      titulo: d.nome,
      valor: (l) => (l.medias[d.id] == null ? '-' : formatarNumero(l.medias[d.id])),
    })),
  ];
  // Class average per subject = mean of the student averages (students without grades are left out)
  const mediasDaTurma = Object.fromEntries(
    disciplinas.map((d) => [d.id, calcularMedia(linhas.map((l) => l.medias[d.id]).filter((m) => m != null))])
  );

  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Notas (média por disciplina)
        </Typography>
        <BotoesExportar
          nomeArquivo={`notas-turma-${turmaId}`}
          titulo={`Notas · ${titulo}`}
          colunas={colunas}
          carregarLinhas={async () => [...linhas, { nome: 'Média da turma', medias: mediasDaTurma }]}
          aoErro={setErroExportacao}
          paisagem={disciplinas.length > 4}
        />
      </Stack>
      <AlertaErro erro={erro} />
      <AlertaErro erro={erroExportacao} />
      <Paper>
        <Box sx={{ height: 4 }}>{carregando && <LinearProgress />}</Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Aluno</TableCell>
                {disciplinas.map((d) => (
                  <TableCell key={d.id} align="right">
                    {d.nome}
                    {d.professor && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {d.professor}
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.matricula_id} hover>
                  <TableCell>{l.nome}</TableCell>
                  {disciplinas.map((d) => (
                    <TableCell
                      key={d.id}
                      align="right"
                      sx={{ color: l.medias[d.id] != null && l.medias[d.id] < 6 ? 'error.main' : undefined }}
                    >
                      {l.medias[d.id] == null ? '-' : formatarNumero(l.medias[d.id])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            {linhas.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Média da turma</TableCell>
                  {disciplinas.map((d) => (
                    <TableCell key={d.id} align="right" sx={{ fontWeight: 600 }}>
                      {mediasDaTurma[d.id] == null ? '-' : formatarNumero(mediasDaTurma[d.id])}
                    </TableCell>
                  ))}
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>
      </Paper>
      <Typography variant="caption" color="text.secondary">
        Médias abaixo de 6 aparecem em vermelho. "-" quer dizer que o aluno ainda não tem nota na disciplina.
      </Typography>
    </Box>
  );
}

export default function Relatorios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const turmaId = searchParams.get('turma_id') ?? '';

  const turmas = useCarregamento(listarTurmas, []);
  const alunos = useCarregamento(listarTodosAlunos, []);
  const disciplinas = useCarregamento(listarDisciplinas, []);
  const professores = useCarregamento(listarProfessores, []);
  const frequencia = useCarregamento(() => (turmaId ? resumoFrequenciaDaTurma(turmaId) : vazio()), [turmaId]);
  const notas = useCarregamento(() => (turmaId ? resumoNotasDaTurma(turmaId) : vazio()), [turmaId]);
  const atribuicoes = useCarregamento(() => (turmaId ? listarAtribuicoesDaTurma(turmaId) : vazio()), [turmaId]);

  const turma = (turmas.dados ?? []).find((t) => String(t.id) === turmaId);
  const titulo = turma ? nomeDaTurma(turma) : `Turma #${turmaId}`;

  const nomeDoAluno = useMemo(() => {
    const porId = new Map((alunos.dados ?? []).map((a) => [a.id, a.nome]));
    return (alunoId) => porId.get(alunoId) ?? `Aluno #${alunoId}`;
  }, [alunos.dados]);

  const linhasFrequencia = useMemo(
    () =>
      (frequencia.dados ?? [])
        .map((l) => ({ ...l, nome: nomeDoAluno(l.aluno_id) }))
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [frequencia.dados, nomeDoAluno]
  );

  // Columns: the subjects of the class plus any subject that has grades here (e.g. an assignment removed later)
  const disciplinasDoRelatorio = useMemo(() => {
    const porId = new Map((disciplinas.dados ?? []).map((d) => [d.id, d]));
    const professorPorId = new Map((professores.dados ?? []).map((p) => [p.id, p.nome]));
    const professorDaDisciplina = new Map(
      (atribuicoes.dados ?? []).map((a) => [a.disciplina_id, professorPorId.get(a.professor_id)])
    );
    const ids = new Set([
      ...(atribuicoes.dados ?? []).map((a) => a.disciplina_id),
      ...(notas.dados ?? []).map((n) => n.disciplina_id).filter((id) => id != null),
    ]);
    return [...ids]
      .map((id) => ({
        id,
        nome: porId.get(id)?.nome ?? `Disciplina #${id}`,
        professor: professorDaDisciplina.get(id),
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [disciplinas.dados, professores.dados, atribuicoes.dados, notas.dados]);

  // One line per enrollment (from the attendance summary, which lists every enrollment of the class)
  const linhasNotas = useMemo(() => {
    const mediasPorMatricula = new Map();
    (notas.dados ?? []).forEach((n) => {
      if (n.disciplina_id == null) return;
      const medias = mediasPorMatricula.get(n.matricula_id) ?? {};
      medias[n.disciplina_id] = n.media;
      mediasPorMatricula.set(n.matricula_id, medias);
    });
    return linhasFrequencia.map((l) => ({
      matricula_id: l.matricula_id,
      nome: l.nome,
      medias: mediasPorMatricula.get(l.matricula_id) ?? {},
    }));
  }, [notas.dados, linhasFrequencia]);

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Relatórios da turma
      </Typography>

      <AlertaErro erro={turmas.erro} />
      <TextField
        select
        label="Turma"
        size="small"
        value={turma ? turmaId : ''}
        onChange={(e) => setSearchParams({ turma_id: e.target.value })}
        sx={{ minWidth: 280, mb: 3 }}
      >
        {(turmas.dados ?? []).map((t) => (
          <MenuItem key={t.id} value={String(t.id)}>
            {nomeDaTurma(t)}
          </MenuItem>
        ))}
      </TextField>

      {alunos.erro && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Os nomes dos alunos não carregaram ({alunos.erro.message}). Os números aparecem com o id do aluno.
        </Alert>
      )}

      {!turmaId ? (
        <Typography color="text.secondary">Escolha uma turma para ver a frequência e as notas.</Typography>
      ) : (
        <>
          <RelatorioFrequencia
            linhas={linhasFrequencia}
            carregando={frequencia.carregando}
            erro={frequencia.erro}
            titulo={titulo}
            turmaId={turmaId}
          />
          <RelatorioNotas
            linhas={linhasNotas}
            disciplinas={disciplinasDoRelatorio}
            carregando={notas.carregando}
            erro={notas.erro}
            titulo={titulo}
            turmaId={turmaId}
          />
        </>
      )}
    </>
  );
}
