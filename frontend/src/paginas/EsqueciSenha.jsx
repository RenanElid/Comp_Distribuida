import { useState } from 'react';
import { Alert, Button, Link as LinkMui, TextField } from '@mui/material';
import { Link } from 'react-router-dom';
import { solicitarRecuperacaoSenha } from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import TelaPublica from '../componentes/TelaPublica';

const PADRAO_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [erroEmail, setErroEmail] = useState(null);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setErro(null);
    if (!PADRAO_EMAIL.test(email.trim())) {
      setErroEmail('Email inválido');
      return;
    }
    setEnviando(true);
    try {
      const resposta = await solicitarRecuperacaoSenha(email.trim());
      setMensagem(resposta.mensagem);
    } catch (falha) {
      setErro(falha);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaPublica
      titulo="Recuperar senha"
      subtitulo="Informe o seu email. Se ele estiver cadastrado, você recebe um link para criar uma nova senha, válido por 1 hora."
      component="form"
      onSubmit={enviar}
      noValidate
    >
      <AlertaErro erro={erro} />
      {mensagem ? (
        <Alert severity="success">{mensagem}</Alert>
      ) : (
        <>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErroEmail(null);
            }}
            error={Boolean(erroEmail)}
            helperText={erroEmail}
            required
            fullWidth
            autoFocus
          />
          <Button type="submit" variant="contained" fullWidth disabled={enviando} sx={{ mt: 2 }}>
            {enviando ? 'Enviando...' : 'Enviar link'}
          </Button>
        </>
      )}
      <LinkMui component={Link} to="/login" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
        Voltar para o login
      </LinkMui>
    </TelaPublica>
  );
}
