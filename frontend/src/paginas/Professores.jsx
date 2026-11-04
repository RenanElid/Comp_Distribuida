import {
  Box,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { listarProfessores } from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import useCarregamento from '../hooks/useCarregamento';

export default function Professores() {
  const { dados, carregando, erro } = useCarregamento(listarProfessores, []);
  const professores = dados ?? [];

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Professores
      </Typography>

      <AlertaErro erro={erro} />

      <Paper>
        <Box sx={{ height: 4 }}>{carregando && <LinearProgress />}</Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Qualificação</TableCell>
                <TableCell>Contato</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {professores.map((professor) => (
                <TableRow key={professor.id} hover>
                  <TableCell>{professor.nome}</TableCell>
                  <TableCell>{professor.qualificacao || '-'}</TableCell>
                  <TableCell>{professor.contato || '-'}</TableCell>
                </TableRow>
              ))}
              {!carregando && !erro && professores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhum professor cadastrado
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
