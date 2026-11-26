import { useState } from 'react';
import { Alert, Button, Link as LinkMui, TextField } from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import { redefinirSenha } from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import TelaPublica from '../componentes/TelaPublica';

// Opened from the link in the email: /redefinir-senha?token=...
export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState(null);
  const [concluido, setConcluido] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Same rule as the backend (8 to 72 characters), checked here to answer before the request
  function validar() {
    const novos = {};
    if (senha.length < 8) novos.senha = 'Mínimo de 8 caracteres';
    else if (senha.length > 72) novos.senha = 'Máximo de 72 caracteres';
    if (confirmacao !== senha) novos.confirmacao = 'As senhas não são iguais';
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErro(null);
    if (!validar()) return;
    setEnviando(true);
    try {
      await redefinirSenha(token, senha);
      setConcluido(true);
    } catch (falha) {
      setErro(falha);
    } finally {
      setEnviando(false);
    }
  }

  const voltar = (
    <LinkMui component={Link} to="/login" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
      Ir para o login
    </LinkMui>
  );

  if (!token) {
    return (
      <TelaPublica titulo="Nova senha">
        <Alert severity="warning">Link incompleto. Abra o link exatamente como chegou no email.</Alert>
        {voltar}
      </TelaPublica>
    );
  }

  if (concluido) {
    return (
      <TelaPublica titulo="Nova senha">
        <Alert severity="success">Senha alterada. Entre com a nova senha.</Alert>
        {voltar}
      </TelaPublica>
    );
  }

  return (
    <TelaPublica
      titulo="Nova senha"
      subtitulo="Escolha uma senha de 8 a 72 caracteres."
      component="form"
      onSubmit={enviar}
      noValidate
    >
      {/* 400 here means the link expired (1 hour) or was already used */}
      <AlertaErro erro={erro} />
      {erro?.status === 400 && (
        <LinkMui component={Link} to="/esqueci-senha" sx={{ display: 'block', mb: 2 }}>
          Pedir um novo link
        </LinkMui>
      )}
      <TextField
        label="Nova senha"
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        error={Boolean(erros.senha)}
        helperText={erros.senha}
        fullWidth
        autoFocus
        margin="normal"
        slotProps={{ htmlInput: { maxLength: 72 } }}
      />
      <TextField
        label="Repita a nova senha"
        type="password"
        value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)}
        error={Boolean(erros.confirmacao)}
        helperText={erros.confirmacao}
        fullWidth
        margin="normal"
        slotProps={{ htmlInput: { maxLength: 72 } }}
      />
      <Button type="submit" variant="contained" fullWidth disabled={enviando} sx={{ mt: 2 }}>
        {enviando ? 'Salvando...' : 'Salvar nova senha'}
      </Button>
      {voltar}
    </TelaPublica>
  );
}
