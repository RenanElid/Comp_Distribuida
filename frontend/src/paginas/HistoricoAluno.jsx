import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import {
  buscarAluno,
  listarDisciplinas,
  listarFrequencias,
  listarMatriculas,
  listarNotas,
  listarTurmas,
} from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import BotoesExportar from '../componentes/BotoesExportar';
import useCarregamento from '../hooks/useCarregamento';
import {
  NOMES_TURNO,
  PRESENCA_MINIMA,
  calcularMedia,
  formatarData,
  formatarNumero,
  formatarPercentual,
} from '../utils/formatos';

// Grades and attendance of one enrollment, summarized for the report card
async function carregarMatricula(matricula) {
  const [notas, frequencias] = await Promise.all([listarNotas(matricula.id), listarFrequencias(matricula.id)]);
  const presentes = frequencias.filter((f) => f.situacao !== 'FALTA').length;
  const porDisciplina = new Map();
  notas.notas.forEach((nota) => {
    const lista = porDisciplina.get(nota.disciplina_id) ?? [];
    lista.push(nota);
    porDisciplina.set(nota.disciplina_id, lista);
  });
  return {
    matricula,
    disciplinas: [...porDisciplina.entries()].map(([disciplinaId, lista]) => ({
      disciplinaId,
      notas: lista,
      media: calcularMedia(lista.map((n) => n.valor)),
    })),
    dias: frequencias.length,
    faltas: frequencias.filter((f) => f.situacao === 'FALTA').length,
    percentual: frequencias.length ? Math.round((presentes * 1000) / frequencias.length) / 10 : null,
  };
}

async function carregarHistorico(alunoId) {
  const matriculas = await listarMatriculas({ aluno_id: alunoId });
  return Promise.all(matriculas.map(carregarMatricula));
}

export default function HistoricoAluno() {
  const { id } = useParams();
  const aluno = useCarregamento(() => buscarAluno(id), [id]);
  const historico = useCarregamento(() => carregarHistorico(id), [id]);
  const turmas = useCarregamento(listarTurmas, []);
  const disciplinas = useCarregamento(listarDisciplinas, []);
  const [erroExportacao, setErroExportacao] = useState(null);

  const turmaPorId = useMemo(() => new Map((turmas.dados ?? []).map((t) => [t.id, t])), [turmas.dados]);
  const nomeDisciplina = useMemo(() => {
    const porId = new Map((disciplinas.dados ?? []).map((d) => [d.id, d.nome]));
    return (disciplinaId) =>
      disciplinaId == null ? 'Sem disciplina' : (porId.get(disciplinaId) ?? `Disciplina #${disciplinaId}`);
  }, [disciplinas.dados]);

  // Most recent school year first
  const anos = useMemo(
    () =>
      [...(historico.dados ?? [])].sort(
        (a, b) =>
          (b.matricula.ano_letivo ?? turmaPorId.get(b.matricula.turma_id)?.ano_letivo ?? 0) -
          (a.matricula.ano_letivo ?? turmaPorId.get(a.matricula.turma_id)?.ano_letivo ?? 0)
      ),
    [historico.dados, turmaPorId]
  );

  const descreverTurma = (turmaId) => {
    const turma = turmaPorId.get(turmaId);
    return turma ? `${turma.nome} · ${turma.ano_letivo} · ${NOMES_TURNO[turma.turno] ?? ''}` : `Turma #${turmaId}`;
  };

  // One line per subject of every year: what the report card PDF/CSV shows
  const colunas = [
    { titulo: 'Turma', valor: (l) => l.turma },
    { titulo: 'Disciplina', valor: (l) => l.disciplina },
    { titulo: 'Notas', valor: (l) => l.notas },
    { titulo: 'Média', valor: (l) => l.media },
    { titulo: 'Presença na turma', valor: (l) => l.presenca },
  ];
  const linhasExportacao = () =>
    anos.flatMap((ano) => {
      const comum = { turma: descreverTurma(ano.matricula.turma_id), presenca: formatarPercentual(ano.percentual) };
      if (ano.disciplinas.length === 0) return [{ ...comum, disciplina: '-', notas: '-', media: '-' }];
      return ano.disciplinas.map((d) => ({
        ...comum,
        disciplina: nomeDisciplina(d.disciplinaId),
        notas: d.notas.map((n) => `${n.descricao}: ${formatarNumero(n.valor)}`).join(', '),
        media: d.media == null ? '-' : formatarNumero(d.media),
      }));
    });

  const voltar = (
    <Button component={Link} to="/alunos" sx={{ mb: 2 }}>
      ← Voltar para alunos
    </Button>
  );

  if (aluno.erro?.status === 404 || aluno.erro?.status === 422) {
    return (
      <>
        {voltar}
        <Alert severity="info">Aluno não encontrado</Alert>
      </>
    );
  }

  return (
    <>
      {voltar}
      <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5">
            Histórico · {aluno.dados ? `${aluno.dados.nome} (${aluno.dados.matricula})` : `Aluno #${id}`}
          </Typography>
          {aluno.dados && (
            <Typography variant="body2" color="text.secondary">
              Nascimento: {formatarData(aluno.dados.data_nascimento)}
            </Typography>
          )}
        </Box>
        <BotoesExportar
          nomeArquivo={`historico-${aluno.dados?.matricula ?? id}`}
          titulo={`Histórico escolar · ${aluno.dados ? `${aluno.dados.nome} (${aluno.dados.matricula})` : `Aluno #${id}`}`}
          colunas={colunas}
          carregarLinhas={async () => linhasExportacao()}
          aoErro={setErroExportacao}
          paisagem
        />
      </Stack>

      <AlertaErro erro={aluno.erro} />
      <AlertaErro erro={historico.erro} />
      <AlertaErro erro={erroExportacao} />

      {historico.carregando && !historico.dados && (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {historico.dados?.length === 0 && (
        <Typography color="text.secondary">Este aluno ainda não foi matriculado em nenhuma turma.</Typography>
      )}

      <Stack spacing={3}>
        {anos.map((ano) => (
          <Paper key={ano.matricula.id} sx={{ p: 2 }}>
            <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {descreverTurma(ano.matricula.turma_id)}
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                color={ano.percentual == null ? 'default' : ano.percentual < PRESENCA_MINIMA ? 'error' : 'success'}
                label={`Presença ${formatarPercentual(ano.percentual)} · ${ano.faltas} falta(s) em ${ano.dias} dia(s)`}
              />
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Disciplina</TableCell>
                    <TableCell>Notas</TableCell>
                    <TableCell align="right">Média</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ano.disciplinas.map((d) => (
                    <TableRow key={d.disciplinaId ?? 'sem'}>
                      <TableCell>{nomeDisciplina(d.disciplinaId)}</TableCell>
                      <TableCell>
                        {d.notas.map((n) => `${n.descricao}: ${formatarNumero(n.valor)}`).join(' · ')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: d.media < 6 ? 'error.main' : undefined }}>
                        {d.media == null ? '-' : formatarNumero(d.media)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {ano.disciplinas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ color: 'text.secondary' }}>
                        Nenhuma nota lançada nesta turma
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ))}
      </Stack>
    </>
  );
}
