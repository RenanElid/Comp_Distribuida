import { AppBar, Badge, Box, Button, Chip, Container, Toolbar, Typography } from '@mui/material';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';
import useNaoLidas from '../hooks/useNaoLidas';
import { NOMES_PERFIL, temAcessoAoPainel } from '../utils/permissoes';

// apenasPainel: hidden for STUDENT and PARENT, who only see the start page and notifications
const ITENS_MENU = [
  { rotulo: 'Início', caminho: '/' },
  { rotulo: 'Alunos', caminho: '/alunos', apenasPainel: true },
  { rotulo: 'Professores', caminho: '/professores', apenasPainel: true },
  { rotulo: 'Turmas', caminho: '/turmas', apenasPainel: true },
  { rotulo: 'Notificações', caminho: '/notificacoes', mostrarNaoLidas: true },
];

export default function Layout() {
  const { usuario, sair } = useAuth();
  const naoLidas = useNaoLidas();
  const painelCompleto = temAcessoAoPainel(usuario.perfil);
  const itensVisiveis = ITENS_MENU.filter((item) => painelCompleto || !item.apenasPainel);

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1 }}>
          <Typography variant="h6" sx={{ mr: 3 }}>
            DistriSchool
          </Typography>
          {itensVisiveis.map((item) => (
            <Button
              key={item.caminho}
              component={NavLink}
              to={item.caminho}
              end={item.caminho === '/'}
              color="inherit"
              sx={{ '&.active': { bgcolor: 'rgba(255,255,255,0.15)' } }}
            >
              {item.mostrarNaoLidas ? (
                // badgeContent 0 or null hides the badge
                <Badge badgeContent={naoLidas} color="error" sx={{ '& .MuiBadge-badge': { right: -10 } }}>
                  {item.rotulo}
                </Badge>
              ) : (
                item.rotulo
              )}
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
