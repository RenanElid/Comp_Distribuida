import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  LinearProgress,
  Link as LinkMui,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { listarTurmas } from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import useCarregamento from '../hooks/useCarregamento';

export const NOMES_TURNO = { MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite' };

// estadoDoLink carries the year filter so the detail page can come back to it
function LinhaTurma({ turma, estadoDoLink }) {
  return (
    <TableRow hover>
      <TableCell>
        <LinkMui component={Link} to={`/turmas/${turma.id}`} state={estadoDoLink}>
          {turma.nome}
        </LinkMui>
      </TableCell>
      <TableCell>{turma.ano_letivo}</TableCell>
      <TableCell>{NOMES_TURNO[turma.turno] ?? turma.turno}</TableCell>
    </TableRow>
  );
}

export default function Turmas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const estadoDoLink = { voltarPara: useLocation().search };
  // Only digits reach the API; anything else in the URL is treated as "all years"
  const parametroAno = searchParams.get('ano_letivo') ?? '';
  const anoLetivo = /^\d+$/.test(parametroAno) ? parametroAno : '';

  const [anoDigitado, setAnoDigitado] = useState(anoLetivo);
  useEffect(() => setAnoDigitado(anoLetivo), [anoLetivo]);

  const { dados, carregando, erro } = useCarregamento(() => listarTurmas({ ano_letivo: anoLetivo }), [anoLetivo]);
  const turmas = dados ?? [];

  function buscar(evento) {
    evento.preventDefault();
    const ano = anoDigitado.trim();
    setSearchParams(ano ? { ano_letivo: ano } : {});
  }

  function limpar() {
    setAnoDigitado('');
    setSearchParams({});
  }

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Turmas
      </Typography>

      <Box component="form" onSubmit={buscar} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <TextField
          label="Ano letivo"
          type="number"
          size="small"
          value={anoDigitado}
          onChange={(e) => setAnoDigitado(e.target.value)}
          sx={{ width: 160 }}
        />
        <Button type="submit" variant="outlined">
          Buscar
        </Button>
        <Button onClick={limpar}>Limpar</Button>
      </Box>

      <AlertaErro erro={erro} />

      <Paper>
        <Box sx={{ height: 4 }}>{carregando && <LinearProgress />}</Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Ano letivo</TableCell>
                <TableCell>Turno</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {turmas.map((turma) => (
                <LinhaTurma key={turma.id} turma={turma} estadoDoLink={estadoDoLink} />
              ))}
              {!carregando && !erro && turmas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {anoLetivo ? `Nenhuma turma em ${anoLetivo}` : 'Nenhuma turma cadastrada'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}
