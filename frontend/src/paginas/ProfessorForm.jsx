import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link as LinkMui,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  atualizarProfessor,
  buscarProfessor,
  criarProfessor,
  excluirProfessor,
  listarAtribuicoesDoProfessor,
  listarDisciplinas,
  listarTurmas,
} from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import { useAuth } from '../contexto/AuthContext';
import useCarregamento from '../hooks/useCarregamento';
import { podeEditarCadastros } from '../utils/permissoes';
import { NOMES_TURNO } from '../utils/formatos';

const VALORES_INICIAIS = { email: '', senha: '', nome: '', qualificacao: '', contato: '' };
const CAMPOS_DO_FORM = Object.keys(VALORES_INICIAIS);

// Same limits as the Pydantic schema, only to stop typing past them
const TAMANHO_MAXIMO = { email: 255, senha: 72, nome: 150, qualificacao: 255, contato: 100 };

const DICAS = {
  email: 'Usado no login do professor',
  senha: 'De 8 a 72 caracteres',
  qualificacao: 'Ex.: Licenciatura em Matemática',
};

// Classes and subjects of the teacher. Three independent loads: names fall back to "#id" if one fails.
function AtribuicoesDoProfessor({ professorId }) {
  const atribuicoes = useCarregamento(() => listarAtribuicoesDoProfessor(professorId), [professorId]);
  const turmas = useCarregamento(listarTurmas, []);
  const disciplinas = useCarregamento(listarDisciplinas, []);

  const turmasPorId = useMemo(() => new Map((turmas.dados ?? []).map((t) => [t.id, t])), [turmas.dados]);
  const disciplinasPorId = useMemo(() => new Map((disciplinas.dados ?? []).map((d) => [d.id, d])), [disciplinas.dados]);

  return (
    <Paper sx={{ p: 3, maxWidth: 720, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Turmas e disciplinas
      </Typography>
      <AlertaErro erro={atribuicoes.erro} />
      {atribuicoes.carregando && !atribuicoes.dados && <CircularProgress size={24} />}
      {atribuicoes.dados?.length === 0 && (
        <Typography color="text.secondary">
          Nenhuma atribuição. Para atribuir, abra a turma e use "Atribuir professor".
        </Typography>
      )}
      <List dense disablePadding>
        {(atribuicoes.dados ?? []).map((atribuicao) => {
          const turma = turmasPorId.get(atribuicao.turma_id);
          const disciplina = disciplinasPorId.get(atribuicao.disciplina_id);
          return (
            <ListItem key={atribuicao.id} disableGutters>
              <ListItemText
                primary={disciplina?.nome ?? `Disciplina #${atribuicao.disciplina_id}`}
                secondary={
                  <LinkMui component={Link} to={`/turmas/${atribuicao.turma_id}`}>
                    {turma
                      ? `${turma.nome} · ${turma.ano_letivo} · ${NOMES_TURNO[turma.turno] ?? turma.turno}`
                      : `Turma #${atribuicao.turma_id}`}
                  </LinkMui>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
}

export default function ProfessorForm() {
  const { id } = useParams();
  const editando = id !== undefined;
  const { usuario } = useAuth();
  const permitido = podeEditarCadastros(usuario.perfil);
  const navegar = useNavigate();

  const [valores, setValores] = useState(VALORES_INICIAIS);
  const [nomeOriginal, setNomeOriginal] = useState('');
  const [carregando, setCarregando] = useState(editando && permitido);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errosCampos, setErrosCampos] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  // Subjects the teacher can teach: the class assignment only offers teachers of the chosen subject
  const [disciplinaIds, setDisciplinaIds] = useState([]);
  const disciplinas = useCarregamento(listarDisciplinas, []);
  const disciplinasEscolhidas = (disciplinas.dados ?? []).filter((d) => disciplinaIds.includes(d.id));

  useEffect(() => {
    if (!editando || !permitido) return;
    let ignorar = false;
    buscarProfessor(id)
      .then((professor) => {
        if (ignorar) return;
        setValores({
          ...VALORES_INICIAIS,
          nome: professor.nome,
          qualificacao: professor.qualificacao ?? '',
          contato: professor.contato ?? '',
        });
        setNomeOriginal(professor.nome);
        setDisciplinaIds(professor.disciplina_ids ?? []);
      })
      .catch((e) => {
        if (ignorar) return;
        // 422 here means a non-numeric id in the URL, e.g. /professores/abc
        if (e.status === 404 || e.status === 422) setNaoEncontrado(true);
        else setErroGeral(e);
      })
      .finally(() => {
        if (!ignorar) setCarregando(false);
      });
    return () => {
      ignorar = true;
    };
  }, [id, editando, permitido]);

  function alterar(campo) {
    return (evento) => {
      setValores((atuais) => ({ ...atuais, [campo]: evento.target.value }));
      setErrosCampos((atuais) => ({ ...atuais, [campo]: undefined }));
    };
  }

  function montarCorpo() {
    const texto = (campo) => valores[campo].trim();
    // The teacher PUT ignores null, so "" is what clears an optional field when editing
    const opcional = (campo) => texto(campo) || (editando ? '' : null);
    const corpo = {
      nome: texto('nome'),
      qualificacao: opcional('qualificacao'),
      contato: opcional('contato'),
      disciplina_ids: disciplinaIds,
    };
    if (!editando) {
      corpo.email = texto('email');
      corpo.senha = valores.senha; // never trim a password
    }
    return corpo;
  }

  function tratarErro(erro) {
    if (erro.campos) {
      const doForm = {};
      const outros = [];
      Object.entries(erro.campos).forEach(([campo, mensagem]) => {
        if (CAMPOS_DO_FORM.includes(campo)) doForm[campo] = mensagem;
        else outros.push(`${campo}: ${mensagem}`);
      });
      setErrosCampos(doForm);
      setErroGeral(outros.length ? outros.join(' | ') : 'Corrija os campos destacados');
      return;
    }
    if (erro.status === 409 && /email/i.test(erro.message)) {
      setErrosCampos({ email: 'Email já em uso (pode ser de um professor excluído, o login só é desativado)' });
    }
    setErroGeral(erro);
  }

  async function salvar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErrosCampos({});
    setErroGeral(null);
    try {
      if (editando) await atualizarProfessor(id, montarCorpo());
      else await criarProfessor(montarCorpo());
      navegar('/professores', { replace: true });
    } catch (erro) {
      tratarErro(erro);
      setEnviando(false);
    }
  }

  async function excluir() {
    setEnviando(true);
    try {
      await excluirProfessor(id);
      navegar('/professores', { replace: true });
    } catch (erro) {
      // 409: the teacher still has assignments (the message from the backend says so)
      setConfirmandoExclusao(false);
      setErroGeral(erro);
      setEnviando(false);
    }
  }

  function propsDoCampo(campo) {
    return {
      value: valores[campo],
      onChange: alterar(campo),
      error: Boolean(errosCampos[campo]),
      helperText: errosCampos[campo] ?? DICAS[campo],
      disabled: enviando,
      fullWidth: true,
      slotProps: { htmlInput: { maxLength: TAMANHO_MAXIMO[campo] } },
    };
  }

  const botaoVoltar = (
    <Button component={Link} to="/professores" sx={{ mt: 2 }}>
      Voltar para a lista
    </Button>
  );

  if (!permitido) {
    return (
      <>
        <Alert severity="warning">Sem permissão para acessar esta tela</Alert>
        {botaoVoltar}
      </>
    );
  }
  if (naoEncontrado) {
    return (
      <>
        <Alert severity="info">Professor não encontrado</Alert>
        {botaoVoltar}
      </>
    );
  }
  if (carregando) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {editando ? `Editar professor: ${nomeOriginal}` : 'Novo professor'}
      </Typography>

      <Paper component="form" onSubmit={salvar} noValidate sx={{ p: 3, maxWidth: 720 }}>
        <AlertaErro erro={erroGeral} />

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          {!editando && (
            <>
              <TextField label="Email" type="email" required {...propsDoCampo('email')} />
              <TextField label="Senha" type="password" required {...propsDoCampo('senha')} />
            </>
          )}
          <Box sx={{ gridColumn: { sm: 'span 2' } }}>
            <TextField label="Nome" required {...propsDoCampo('nome')} />
          </Box>
          <TextField label="Qualificação" {...propsDoCampo('qualificacao')} />
          <TextField label="Contato" {...propsDoCampo('contato')} />
          <Box sx={{ gridColumn: { sm: 'span 2' } }}>
            <Autocomplete
              multiple
              options={disciplinas.dados ?? []}
              getOptionLabel={(disciplina) => disciplina.nome}
              isOptionEqualToValue={(opcao, valor) => opcao.id === valor.id}
              value={disciplinasEscolhidas}
              onChange={(_, escolhidas) => setDisciplinaIds(escolhidas.map((d) => d.id))}
              disabled={enviando || Boolean(disciplinas.erro)}
              noOptionsText="Nenhuma disciplina cadastrada"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Disciplinas que leciona"
                  helperText={
                    disciplinas.erro
                      ? 'As disciplinas não carregaram; as atuais são mantidas ao salvar'
                      : 'Na atribuição de uma turma, só aparecem os professores da disciplina escolhida'
                  }
                />
              )}
            />
          </Box>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
          <Button type="submit" variant="contained" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button component={Link} to="/professores" disabled={enviando}>
            Cancelar
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          {editando && (
            <Button color="error" onClick={() => setConfirmandoExclusao(true)} disabled={enviando}>
              Excluir
            </Button>
          )}
        </Stack>
      </Paper>

      {editando && <AtribuicoesDoProfessor professorId={id} />}

      <Dialog open={confirmandoExclusao} onClose={() => !enviando && setConfirmandoExclusao(false)}>
        <DialogTitle>Excluir {nomeOriginal}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            O cadastro do professor será apagado e o login dele será desativado. Só é possível excluir um professor sem
            turmas atribuídas. Essa ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmandoExclusao(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={excluir} disabled={enviando}>
            {enviando ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
