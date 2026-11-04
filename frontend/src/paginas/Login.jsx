import { useState } from 'react';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';
import AlertaErro from '../componentes/AlertaErro';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  async function enviar(evento) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email, senha);
      // Go back to the page the user tried to open before being sent to login
      navegar(local.state?.de ?? '/', { replace: true });
    } catch (e) {
      setErro(e);
      setEnviando(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'grey.100', p: 2 }}>
      <Paper component="form" onSubmit={enviar} sx={{ p: 4, width: '100%', maxWidth: 380 }}>
        <Typography variant="h5" gutterBottom>
          DistriSchool
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Entre com seu email e senha
        </Typography>
        <AlertaErro erro={erro} />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoFocus
          margin="normal"
        />
        <TextField
          label="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" fullWidth disabled={enviando} sx={{ mt: 2 }}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </Button>
      </Paper>
    </Box>
  );
}
