import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
  Typography,
} from '@mui/material';
import { atualizarDisciplina, criarDisciplina, excluirDisciplina, listarDisciplinas } from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import { useAuth } from '../contexto/AuthContext';
import useCarregamento from '../hooks/useCarregamento';
import { podeEditarCadastros } from '../utils/permissoes';

const VAZIO = { nome: '', carga_horaria: '' };

export default function Disciplinas() {
  const { usuario } = useAuth();
  const podeEditar = podeEditarCadastros(usuario.perfil);
  const { dados, carregando, erro, recarregar } = useCarregamento(listarDisciplinas, []);
  const disciplinas = [...(dados ?? [])].sort((a, b) => a.nome.localeCompare(b.nome));

  // editando: null = dialog closed, {} = new subject, a subject = editing it
  const [editando, setEditando] = useState(null);
  const [valores, setValores] = useState(VAZIO);
  const [aExcluir, setAExcluir] = useState(null);
  const [errosCampos, setErrosCampos] = useState({});
  const [erroDialog, setErroDialog] = useState(null);
  const [enviando, setEnviando] = useState(false);

  function abrir(disciplina) {
    setEditando(disciplina);
    setValores(disciplina.id ? { nome: disciplina.nome, carga_horaria: String(disciplina.carga_horaria) } : VAZIO);
    setErrosCampos({});
    setErroDialog(null);
  }

  function alterar(campo) {
    return (evento) => {
      setValores((atuais) => ({ ...atuais, [campo]: evento.target.value }));
      setErrosCampos((atuais) => ({ ...atuais, [campo]: undefined }));
    };
  }

  async function salvar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErroDialog(null);
    const corpo = {
      nome: valores.nome.trim(),
      carga_horaria: valores.carga_horaria === '' ? null : Number(valores.carga_horaria),
    };
    try {
      if (editando.id) await atualizarDisciplina(editando.id, corpo);
      else await criarDisciplina(corpo);
      setEditando(null);
      recarregar();
    } catch (falha) {
      setErrosCampos(falha.campos ?? {});
      setErroDialog(falha.campos ? 'Corrija os campos destacados' : falha);
    } finally {
      setEnviando(false);
    }
  }

  async function excluir() {
    setEnviando(true);
    setErroDialog(null);
    try {
      await excluirDisciplina(aExcluir.id);
      setAExcluir(null);
      recarregar();
    } catch (falha) {
      setErroDialog(falha);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Disciplinas</Typography>
        {podeEditar && (
          <Button variant="contained" onClick={() => abrir({})}>
            + Nova
          </Button>
        )}
      </Stack>

      <AlertaErro erro={erro} />

      <Paper>
        <Box sx={{ height: 4 }}>{carregando && <LinearProgress />}</Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Carga horária</TableCell>
                {podeEditar && <TableCell align="right">Ações</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {disciplinas.map((disciplina) => (
                <TableRow key={disciplina.id} hover>
                  <TableCell>{disciplina.nome}</TableCell>
                  <TableCell>{disciplina.carga_horaria} h</TableCell>
                  {podeEditar && (
                    <TableCell align="right">
                      <Button size="small" onClick={() => abrir(disciplina)}>
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          setErroDialog(null);
                          setAExcluir(disciplina);
                        }}
                      >
                        Excluir
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {!carregando && !erro && disciplinas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={podeEditar ? 3 : 2} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhuma disciplina cadastrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(editando)} onClose={() => !enviando && setEditando(null)} fullWidth maxWidth="xs">
        <form onSubmit={salvar} noValidate>
          <DialogTitle>{editando?.id ? 'Editar disciplina' : 'Nova disciplina'}</DialogTitle>
          <DialogContent>
            <AlertaErro erro={erroDialog} sx={{ mt: 1 }} />
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nome"
                required
                value={valores.nome}
                onChange={alterar('nome')}
                error={Boolean(errosCampos.nome)}
                helperText={errosCampos.nome}
                disabled={enviando}
                slotProps={{ htmlInput: { maxLength: 100 } }}
              />
              <TextField
                label="Carga horária (horas)"
                type="number"
                required
                value={valores.carga_horaria}
                onChange={alterar('carga_horaria')}
                error={Boolean(errosCampos.carga_horaria)}
                helperText={errosCampos.carga_horaria}
                disabled={enviando}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditando(null)} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={enviando}>
              {enviando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={Boolean(aExcluir)} onClose={() => !enviando && setAExcluir(null)}>
        <DialogTitle>Excluir {aExcluir?.nome}?</DialogTitle>
        <DialogContent>
          <AlertaErro erro={erroDialog} />
          <DialogContentText>
            A disciplina sai de todas as turmas, junto com os professores atribuídos a ela. As notas já lançadas
            continuam, mas passam a aparecer como "Disciplina #id". Essa ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAExcluir(null)} disabled={enviando}>
            Voltar
          </Button>
          <Button color="error" variant="contained" onClick={excluir} disabled={enviando}>
            {enviando ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
