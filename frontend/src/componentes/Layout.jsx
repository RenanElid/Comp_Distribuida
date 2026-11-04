import { AppBar, Box, Button, Chip, Container, Toolbar, Typography } from '@mui/material';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';
import { NOMES_PERFIL } from '../utils/permissoes';

// Menu items are added here as each screen is built
const ITENS_MENU = [
  { rotulo: 'Início', caminho: '/' },
  { rotulo: 'Alunos', caminho: '/alunos' },
];

export default function Layout() {
  const { usuario, sair } = useAuth();

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1 }}>
          <Typography variant="h6" sx={{ mr: 3 }}>
            DistriSchool
          </Typography>
          {ITENS_MENU.map((item) => (
            <Button
              key={item.caminho}
              component={NavLink}
              to={item.caminho}
              end={item.caminho === '/'}
              color="inherit"
              sx={{ '&.active': { bgcolor: 'rgba(255,255,255,0.15)' } }}
            >
              {item.rotulo}
            </Button>
          ))}
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {usuario.email}
          </Typography>
          <Chip label={NOMES_PERFIL[usuario.perfil]} size="small" sx={{ bgcolor: 'white' }} />
          <Button color="inherit" onClick={sair}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </>
  );
}
