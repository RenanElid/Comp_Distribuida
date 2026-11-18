import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';
import { ROTAS_PERFIL_LIMITADO, temAcessoAoPainel } from '../utils/permissoes';

// Gatekeeper for every page except login: no user -> login,
// STUDENT/PARENT -> only the pages in ROTAS_PERFIL_LIMITADO (anything else goes to notifications)
export default function RotaProtegida() {
  const { usuario, carregando } = useAuth();
  const local = useLocation();

  if (carregando) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!usuario) return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  if (!temAcessoAoPainel(usuario.perfil) && !ROTAS_PERFIL_LIMITADO.includes(local.pathname)) {
    return <Navigate to="/notificacoes" replace />;
  }
  return <Outlet />;
}
