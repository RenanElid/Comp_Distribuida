import { useState } from 'react';
import {
  Box,
  Button,
  LinearProgress,
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
import { Link } from 'react-router-dom';
import { listarProfessores } from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import BotoesExportar from '../componentes/BotoesExportar';
import { useAuth } from '../contexto/AuthContext';
import useCarregamento from '../hooks/useCarregamento';
import { podeEditarCadastros } from '../utils/permissoes';

const COLUNAS_EXPORTACAO = [
  { titulo: 'Nome', valor: (professor) => professor.nome },
  { titulo: 'Qualificação', valor: (professor) => professor.qualificacao },
  { titulo: 'Contato', valor: (professor) => professor.contato },
];

export default function Professores() {
  const { usuario } = useAuth();
  const podeEditar = podeEditarCadastros(usuario.perfil);
  const { dados, carregando, erro } = useCarregamento(listarProfessores, []);
  const [erroExportacao, setErroExportacao] = useState(null);
  const professores = dados ?? [];

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Typography variant="h5">Professores</Typography>
        {podeEditar && (
          <Button variant="contained" component={Link} to="/professores/novo">
            + Novo
          </Button>
        )}
      </Stack>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {/* The list has no pagination, so the export reuses what is already loaded */}
        <BotoesExportar
          nomeArquivo="professores"
          titulo="Professores"
          colunas={COLUNAS_EXPORTACAO}
          carregarLinhas={async () => professores}
          aoErro={setErroExportacao}
        />
      </Box>

      <AlertaErro erro={erro} />
      <AlertaErro erro={erroExportacao} />

      <Paper>
        <Box sx={{ height: 4 }}>{carregando && <LinearProgress />}</Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Qualificação</TableCell>
                <TableCell>Contato</TableCell>
                {podeEditar && <TableCell align="right">Ações</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {professores.map((professor) => (
                <TableRow key={professor.id} hover>
                  <TableCell>{professor.nome}</TableCell>
                  <TableCell>{professor.qualificacao || '-'}</TableCell>
                  <TableCell>{professor.contato || '-'}</TableCell>
                  {podeEditar && (
                    <TableCell align="right">
                      <Button size="small" component={Link} to={`/professores/${professor.id}`}>
                        Editar
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {!carregando && !erro && professores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={podeEditar ? 4 : 3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
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
