import { useEffect, useState } from 'react';
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
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { listarAlunos } from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import { useAuth } from '../contexto/AuthContext';
import { formatarData } from '../utils/formatos';
import { podeEditarAlunos } from '../utils/permissoes';

const TAMANHOS = [5, 10, 20, 50];

// Filters and page live in the URL, so F5 and the back button keep the state
function lerParametros(searchParams) {
  const pagina = Number(searchParams.get('pagina')) || 1;
  const tamanho = Number(searchParams.get('tamanho'));
  return {
    nome: searchParams.get('nome') ?? '',
    matricula: searchParams.get('matricula') ?? '',
    pagina: Math.max(pagina, 1),
    tamanho: TAMANHOS.includes(tamanho) ? tamanho : 20,
  };
}

export default function Alunos() {
  const { usuario } = useAuth();
  const podeEditar = podeEditarAlunos(usuario.perfil);
  const [searchParams, setSearchParams] = useSearchParams();
  const parametros = lerParametros(searchParams);
  // Passed to the form so saving or cancelling returns to these filters and page
  const estadoDoLink = { voltarPara: useLocation().search };
  const { nome, matricula, pagina, tamanho } = parametros;

  // Text typed in the fields; only goes to the URL on "Buscar"
  const [nomeDigitado, setNomeDigitado] = useState(nome);
  const [matriculaDigitada, setMatriculaDigitada] = useState(matricula);

  const [resultado, setResultado] = useState({ itens: [], total: 0 });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Keep the fields in sync when the URL changes from outside (back button)
  useEffect(() => {
    setNomeDigitado(nome);
    setMatriculaDigitada(matricula);
  }, [nome, matricula]);

  useEffect(() => {
    // If the user changes page quickly, an older response may arrive last: ignore it
    let ignorar = false;
    setCarregando(true);
    setErro(null);
    listarAlunos({ nome, matricula, pagina, tamanho })
      .then((dados) => {
        if (ignorar) return;
        // Deleting the only student of the last page leaves it empty: jump to the new last page
        if (dados.itens.length === 0 && pagina > 1 && dados.total > 0) {
          atualizarUrl({ pagina: Math.ceil(dados.total / tamanho) }, { replace: true });
          return;
        }
        setResultado(dados);
      })
      .catch((e) => {
        if (!ignorar) setErro(e);
      })
      .finally(() => {
        if (!ignorar) setCarregando(false);
      });
    return () => {
      ignorar = true;
    };
  }, [nome, matricula, pagina, tamanho]);

  function atualizarUrl(mudancas, opcoes) {
    const novos = { ...parametros, ...mudancas };
    const limpos = {};
    if (novos.nome) limpos.nome = novos.nome;
    if (novos.matricula) limpos.matricula = novos.matricula;
    if (novos.pagina > 1) limpos.pagina = novos.pagina;
    if (novos.tamanho !== 20) limpos.tamanho = novos.tamanho;
    setSearchParams(limpos, opcoes);
  }

  function buscar(evento) {
    evento.preventDefault();
    // A new search always starts on page 1
    atualizarUrl({ nome: nomeDigitado.trim(), matricula: matriculaDigitada.trim(), pagina: 1 });
  }

  function limpar() {
    setNomeDigitado('');
    setMatriculaDigitada('');
    atualizarUrl({ nome: '', matricula: '', pagina: 1 });
  }

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Alunos</Typography>
        {podeEditar && (
          <Button variant="contained" component={Link} to="/alunos/novo" state={estadoDoLink}>
            + Novo
          </Button>
        )}
      </Stack>

      <Box component="form" onSubmit={buscar} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <TextField
          label="Nome"
          size="small"
          value={nomeDigitado}
          onChange={(e) => setNomeDigitado(e.target.value)}
        />
        <TextField
          label="Matrícula (exata)"
          size="small"
          value={matriculaDigitada}
          onChange={(e) => setMatriculaDigitada(e.target.value)}
        />
        <Button type="submit" variant="outlined">
          Buscar
        </Button>
        <Button onClick={limpar}>Limpar</Button>
      </Box>

      <AlertaErro erro={erro} />

      <Paper>
        {/* Fixed-height slot so the table does not jump while loading */}
        <Box sx={{ height: 4 }}>{carregando && <LinearProgress />}</Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Matrícula</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Nascimento</TableCell>
                <TableCell>Contato</TableCell>
                {podeEditar && <TableCell align="right">Ações</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {resultado.itens.map((aluno) => (
                <TableRow key={aluno.id} hover>
                  <TableCell>{aluno.matricula}</TableCell>
                  <TableCell>{aluno.nome}</TableCell>
                  <TableCell>{formatarData(aluno.data_nascimento)}</TableCell>
                  {/* || instead of ??: a cleared field comes back as "" (see AlunoForm) */}
                  <TableCell>{aluno.contato || '-'}</TableCell>
                  {podeEditar && (
                    <TableCell align="right">
                      <Button size="small" component={Link} to={`/alunos/${aluno.id}`} state={estadoDoLink}>
                        Editar
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {!carregando && !erro && resultado.itens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={podeEditar ? 5 : 4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhum aluno encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {/* MUI counts pages from 0, the API from 1 */}
        <TablePagination
          component="div"
          count={resultado.total}
          page={resultado.total === 0 ? 0 : pagina - 1}
          rowsPerPage={tamanho}
          rowsPerPageOptions={TAMANHOS}
          onPageChange={(_, novaPagina) => atualizarUrl({ pagina: novaPagina + 1 })}
          onRowsPerPageChange={(e) => atualizarUrl({ tamanho: Number(e.target.value), pagina: 1 })}
        />
      </Paper>
    </>
  );
}
