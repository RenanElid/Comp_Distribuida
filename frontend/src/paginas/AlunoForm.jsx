import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { atualizarAluno, buscarAluno, criarAluno, excluirAluno } from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import { useAuth } from '../contexto/AuthContext';
import { podeEditarAlunos } from '../utils/permissoes';

const VALORES_INICIAIS = {
  email: '',
  senha: '',
  matricula: '',
  nome: '',
  data_nascimento: '',
  endereco: '',
  contato: '',
};
const CAMPOS_DO_FORM = Object.keys(VALORES_INICIAIS);

// Same limits as the Pydantic schema, only to stop typing past them
const TAMANHO_MAXIMO = { email: 255, senha: 72, matricula: 20, nome: 150, endereco: 255, contato: 100 };

const DICAS = {
  email: 'Usado no login do aluno',
  senha: 'De 8 a 72 caracteres',
};

export default function AlunoForm() {
  const { id } = useParams();
  const editando = id !== undefined;
  const { usuario } = useAuth();
  const permitido = podeEditarAlunos(usuario.perfil);
  const navegar = useNavigate();
  const local = useLocation();
  // The list sends its query string (filters + page) so we can return to the same spot
  const voltarPara = '/alunos' + (local.state?.voltarPara ?? '');

  const [valores, setValores] = useState(VALORES_INICIAIS);
  const [nomeOriginal, setNomeOriginal] = useState('');
  const [carregando, setCarregando] = useState(editando && permitido);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errosCampos, setErrosCampos] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  useEffect(() => {
    if (!editando || !permitido) return;
    let ignorar = false;
    buscarAluno(id)
      .then((aluno) => {
        if (ignorar) return;
        setValores({
          ...VALORES_INICIAIS,
          matricula: aluno.matricula,
          nome: aluno.nome,
          data_nascimento: aluno.data_nascimento,
          endereco: aluno.endereco ?? '',
          contato: aluno.contato ?? '',
        });
        setNomeOriginal(aluno.nome);
      })
      .catch((e) => {
        if (ignorar) return;
        // 422 here means a non-numeric id in the URL, e.g. /alunos/abc
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
    // PUT ignores null (exclude_none), so "" is the only way to clear a field when editing
    const opcional = (campo) => texto(campo) || (editando ? '' : null);
    const corpo = {
      matricula: texto('matricula'),
      nome: texto('nome'),
      // Sent as is: "" makes the backend answer 422 instead of silently keeping the old date
      data_nascimento: valores.data_nascimento,
      endereco: opcional('endereco'),
      contato: opcional('contato'),
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
      if (outros.length) setErroGeral(outros.join(' | '));
      else setErroGeral('Corrija os campos destacados');
      return;
    }
    // 409 has two causes and the backend only says which one in the text
    if (erro.status === 409 && /matr[ií]cula/i.test(erro.message)) {
      setErrosCampos({ matricula: 'Já existe um aluno com esta matrícula' });
    } else if (erro.status === 409 && /email/i.test(erro.message)) {
      setErrosCampos({ email: 'Email já em uso (pode ser de um aluno excluído, o login só é desativado)' });
    }
    setErroGeral(erro);
  }

  async function salvar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErrosCampos({});
    setErroGeral(null);
    try {
      if (editando) await atualizarAluno(id, montarCorpo());
      else await criarAluno(montarCorpo());
      navegar(voltarPara, { replace: true });
    } catch (erro) {
      tratarErro(erro);
      setEnviando(false);
    }
  }

  async function excluir() {
    setEnviando(true);
    try {
      await excluirAluno(id);
      navegar(voltarPara, { replace: true });
    } catch (erro) {
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
    <Button component={Link} to={voltarPara} sx={{ mt: 2 }}>
      Voltar para a lista
    </Button>
  );

  // TEACHER opening the URL by hand: do not even call the API
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
        <Alert severity="info">Aluno não encontrado</Alert>
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
        {editando ? `Editar aluno: ${nomeOriginal}` : 'Novo aluno'}
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
          <TextField label="Matrícula" required {...propsDoCampo('matricula')} />
          <TextField
            label="Data de nascimento"
            type="date"
            required
            {...propsDoCampo('data_nascimento')}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Box sx={{ gridColumn: { sm: 'span 2' } }}>
            <TextField label="Nome" required {...propsDoCampo('nome')} />
          </Box>
          <TextField label="Endereço" {...propsDoCampo('endereco')} />
          <TextField label="Contato" {...propsDoCampo('contato')} />
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
          <Button type="submit" variant="contained" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button component={Link} to={voltarPara} disabled={enviando}>
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

      <Dialog open={confirmandoExclusao} onClose={() => !enviando && setConfirmandoExclusao(false)}>
        <DialogTitle>Excluir {nomeOriginal}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            O cadastro do aluno será apagado, junto com as matrículas, notas e frequências dele. O login será
            desativado. Essa ação não pode ser desfeita.
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
