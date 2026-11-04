import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';
import { temAcessoAoPainel } from '../utils/permissoes';

function SemAcesso({ aoSair }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
        <Typography variant="h6" gutterBottom>
          Seu perfil não tem telas neste painel
        </Typography>
        <Button variant="contained" onClick={aoSair} sx={{ mt: 2 }}>
          Sair
        </Button>
      </Paper>
    </Box>
  );
}

// Gatekeeper for every page except login: no user -> login, STUDENT/PARENT -> no-access screen
export default function RotaProtegida() {
  const { usuario, carregando, sair } = useAuth();
  const local = useLocation();

  if (carregando) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!usuario) return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  if (!temAcessoAoPainel(usuario.perfil)) return <SemAcesso aoSair={sair} />;
  return <Outlet />;
}
