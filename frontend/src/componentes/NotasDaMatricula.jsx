import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
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
import { lancarNota } from '../api/endpoints';
import { calcularMedia, formatarNumero } from '../utils/formatos';
import AlertaErro from './AlertaErro';
import DialogLancamento from './DialogLancamento';

const SEM_DISCIPLINA = 'sem-disciplina';
const FORM_VAZIO = { disciplina_id: '', descricao: '', valor: '' };

// One row per subject of the class (even without grades), plus subjects that only appear in
// the grades and, last, the grades saved before migration V5 (disciplina_id null).
function agruparPorDisciplina(notas, disciplinasDaTurma, nomesDisciplinas) {
  const grupos = new Map();
  disciplinasDaTurma.forEach((d) => grupos.set(d.id, { chave: d.id, nome: d.nome, notas: [] }));
  notas.forEach((nota) => {
    const chave = nota.disciplina_id ?? SEM_DISCIPLINA;
    if (!grupos.has(chave)) {
      const nome =
        chave === SEM_DISCIPLINA ? 'Sem disciplina' : (nomesDisciplinas.get(chave) ?? `Disciplina #${chave}`);
      grupos.set(chave, { chave, nome, notas: [] });
    }
    grupos.get(chave).notas.push(nota);
  });
  return [...grupos.values()]
    .sort((a, b) => (a.chave === SEM_DISCIPLINA) - (b.chave === SEM_DISCIPLINA) || a.nome.localeCompare(b.nome))
    .map((grupo) => ({ ...grupo, media: calcularMedia(grupo.notas.map((n) => n.valor)) }));
}

export default function NotasDaMatricula({
  matriculaId,
  notas,
  disciplinasDaTurma,
  nomesDisciplinas,
  motivoSemDisciplinas,
  nomeAluno,
  podeLancar,
}) {
  const [aberto, setAberto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [valores, setValores] = useState(FORM_VAZIO);
  const [errosCampos, setErrosCampos] = useState({});
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const grupos = useMemo(
    () => agruparPorDisciplina(notas.dados?.notas ?? [], disciplinasDaTurma, nomesDisciplinas),
    [notas.dados, disciplinasDaTurma, nomesDisciplinas]
  );

  function abrir() {
    setValores(FORM_VAZIO);
    setErrosCampos({});
    setErro(null);
    setConfirmando(false);
    setAberto(true);
  }

  function alterar(campo) {
    return (evento) => {
      setValores((atuais) => ({ ...atuais, [campo]: evento.target.value }));
      setErrosCampos((atuais) => ({ ...atuais, [campo]: undefined }));
    };
  }

  // Empty fields go as null (not 0!) so the backend answers 422 "Campo obrigatório"
  function montarCorpo() {
    return {
      matricula_id: Number(matriculaId),
      disciplina_id: valores.disciplina_id === '' ? null : Number(valores.disciplina_id),
      descricao: valores.descricao.trim(),
      valor: valores.valor === '' ? null : Number(valores.valor),
    };
  }

  async function confirmar() {
    setEnviando(true);
    setErro(null);
    try {
      await lancarNota(montarCorpo());
      setAberto(false);
      notas.recarregar();
    } catch (e) {
      // Back to the form so the field errors are visible
      setConfirmando(false);
      setErrosCampos(e.campos ?? {});
      setErro(e.campos ? 'Corrija os campos destacados' : e);
    } finally {
      setEnviando(false);
    }
  }

  const nomeDisciplinaEscolhida =
    disciplinasDaTurma.find((d) => String(d.id) === String(valores.disciplina_id))?.nome ?? '(sem disciplina)';
  const valorDigitado = valores.valor === '' ? '(vazio)' : formatarNumero(Number(valores.valor));
  const resumo = `Lançar ${valorDigitado} em ${nomeDisciplinaEscolhida} (${valores.descricao.trim() || 'sem descrição'}) para ${nomeAluno}?`;

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Notas</Typography>
        {podeLancar && (
          // Disabled buttons do not fire mouse events, so the tooltip needs the span around it
          <Tooltip title={motivoSemDisciplinas ?? ''}>
            <span>
              <Button variant="contained" onClick={abrir} disabled={Boolean(motivoSemDisciplinas)}>
                + Lançar nota
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>

      <AlertaErro erro={notas.erro} />

      <Paper sx={{ mb: 4 }}>
        <Box sx={{ height: 4 }}>{notas.carregando && <LinearProgress />}</Box>
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
              {grupos.map((grupo) => (
                <TableRow key={grupo.chave}>
                  <TableCell sx={{ fontStyle: grupo.chave === SEM_DISCIPLINA ? 'italic' : 'normal' }}>
                    {grupo.nome}
                  </TableCell>
                  <TableCell>
                    {grupo.notas.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Sem notas
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {grupo.notas.map((nota) => (
                          <Chip key={nota.id} size="small" label={`${nota.descricao}: ${formatarNumero(nota.valor)}`} />
                        ))}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {grupo.media === null ? '-' : formatarNumero(grupo.media)}
                  </TableCell>
                </TableRow>
              ))}
              {!notas.carregando && grupos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhuma nota lançada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <DialogLancamento
        aberto={aberto}
        titulo="Lançar nota"
        confirmando={confirmando}
        resumo={resumo}
        enviando={enviando}
        erro={erro}
        aoFechar={() => setAberto(false)}
        aoRevisar={() => {
          setErro(null);
          setConfirmando(true);
        }}
        aoVoltar={() => setConfirmando(false)}
        aoConfirmar={confirmar}
      >
        {/* Only the subjects assigned to this class are offered */}
        <TextField
          select
          label="Disciplina"
          required
          value={valores.disciplina_id}
          onChange={alterar('disciplina_id')}
          error={Boolean(errosCampos.disciplina_id)}
          helperText={errosCampos.disciplina_id}
        >
          {disciplinasDaTurma.map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.nome}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Descrição"
          required
          placeholder="Ex: AV1"
          value={valores.descricao}
          onChange={alterar('descricao')}
          error={Boolean(errosCampos.descricao)}
          helperText={errosCampos.descricao ?? 'Até 50 caracteres'}
          slotProps={{ htmlInput: { maxLength: 50 } }}
        />
        <TextField
          label="Valor"
          type="number"
          required
          value={valores.valor}
          onChange={alterar('valor')}
          error={Boolean(errosCampos.valor)}
          helperText={errosCampos.valor ?? 'De 0 a 10'}
          slotProps={{ htmlInput: { step: 0.1 } }}
        />
      </DialogLancamento>
    </>
  );
}
