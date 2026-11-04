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
  Typography,
} from '@mui/material';
import { registrarFrequencia } from '../api/endpoints';
import { formatarData, formatarNumero, hojeIso } from '../utils/formatos';
import AlertaErro from './AlertaErro';
import DialogLancamento from './DialogLancamento';

const SITUACOES = {
  PRESENTE: { rotulo: 'Presente', cor: 'success' },
  ATRASO: { rotulo: 'Atraso', cor: 'warning' },
  FALTA: { rotulo: 'Falta', cor: 'error' },
};

// Project rule: a late arrival still attended the class, so ATRASO counts as presence
function resumirFrequencia(frequencias) {
  const contar = (situacao) => frequencias.filter((f) => f.situacao === situacao).length;
  const presentes = contar('PRESENTE');
  const atrasos = contar('ATRASO');
  const faltas = contar('FALTA');
  const total = frequencias.length;
  const percentual = total === 0 ? null : ((presentes + atrasos) / total) * 100;
  return { presentes, atrasos, faltas, total, percentual };
}

export default function FrequenciaDaMatricula({ matriculaId, frequencias, nomeAluno, podeLancar }) {
  const [aberto, setAberto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [valores, setValores] = useState({ data: '', situacao: 'PRESENTE' });
  const [errosCampos, setErrosCampos] = useState({});
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const lista = frequencias.dados ?? [];
  const resumo = useMemo(() => resumirFrequencia(lista), [lista]);
  // The API sorts by date ascending; the most recent day is more useful on top
  const maisRecentesPrimeiro = useMemo(() => [...lista].reverse(), [lista]);

  function abrir() {
    setValores({ data: hojeIso(), situacao: 'PRESENTE' });
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

  async function confirmar() {
    setEnviando(true);
    setErro(null);
    try {
      await registrarFrequencia({ matricula_id: Number(matriculaId), data: valores.data, situacao: valores.situacao });
      setAberto(false);
      frequencias.recarregar();
    } catch (e) {
      setConfirmando(false);
      if (e.campos) {
        setErrosCampos(e.campos);
        setErro('Corrija os campos destacados');
      } else {
        // 409: this enrollment already has a record on that day
        if (e.status === 409) setErrosCampos({ data: 'Já existe frequência neste dia' });
        setErro(e);
      }
    } finally {
      setEnviando(false);
    }
  }

  const dataDigitada = valores.data ? formatarData(valores.data) : '(sem data)';
  const textoResumo = `Registrar ${SITUACOES[valores.situacao].rotulo.toUpperCase()} em ${dataDigitada} para ${nomeAluno}?`;

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Frequência</Typography>
        {podeLancar && (
          <Button variant="contained" onClick={abrir}>
            + Registrar frequência
          </Button>
        )}
      </Stack>

      {resumo.total > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography>
            <strong>Presença: {formatarNumero(Math.round(resumo.percentual * 10) / 10)}%</strong> (
            {resumo.presentes + resumo.atrasos} de {resumo.total} dias registrados) · {resumo.presentes} presente(s) ·{' '}
            {resumo.atrasos} atraso(s) · {resumo.faltas} falta(s)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Atraso conta como presença: percentual = (presentes + atrasos) ÷ dias registrados.
          </Typography>
        </Box>
      )}

      <AlertaErro erro={frequencias.erro} />

      <Paper>
        <Box sx={{ height: 4 }}>{frequencias.carregando && <LinearProgress />}</Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Situação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {maisRecentesPrimeiro.map((frequencia) => (
                <TableRow key={frequencia.id}>
                  <TableCell>{formatarData(frequencia.data)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={SITUACOES[frequencia.situacao]?.cor ?? 'default'}
                      label={SITUACOES[frequencia.situacao]?.rotulo ?? frequencia.situacao}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {!frequencias.carregando && lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhuma frequência registrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <DialogLancamento
        aberto={aberto}
        titulo="Registrar frequência"
        confirmando={confirmando}
        resumo={textoResumo}
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
        <TextField
          label="Data"
          type="date"
          required
          value={valores.data}
          onChange={alterar('data')}
          error={Boolean(errosCampos.data)}
          helperText={errosCampos.data}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          select
          label="Situação"
          required
          value={valores.situacao}
          onChange={alterar('situacao')}
          error={Boolean(errosCampos.situacao)}
          helperText={errosCampos.situacao}
        >
          {Object.entries(SITUACOES).map(([valor, { rotulo }]) => (
            <MenuItem key={valor} value={valor}>
              {rotulo}
            </MenuItem>
          ))}
        </TextField>
      </DialogLancamento>
    </>
  );
}
