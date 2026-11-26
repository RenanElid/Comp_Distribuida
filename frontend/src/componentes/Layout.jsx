import { useState } from 'react';
import {
  AppBar,
  Badge,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  SvgIcon,
  Toolbar,
  Typography,
} from '@mui/material';
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
  { rotulo: 'Disciplinas', caminho: '/disciplinas', apenasPainel: true },
  { rotulo: 'Relatórios', caminho: '/relatorios', apenasPainel: true },
  { rotulo: 'Notificações', caminho: '/notificacoes', mostrarNaoLidas: true },
];

// Below "lg" the menu buttons no longer fit in one line, so they move to a side drawer
const MENU_COMPLETO = { xs: 'none', lg: 'flex' };
const MENU_COMPACTO = { xs: 'flex', lg: 'none' };

function IconeMenu() {
  return (
    <SvgIcon>
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </SvgIcon>
  );
}

function Rotulo({ item, naoLidas }) {
  if (!item.mostrarNaoLidas) return item.rotulo;
  // badgeContent 0 or null hides the badge
  return (
    <Badge badgeContent={naoLidas} color="error" sx={{ '& .MuiBadge-badge': { right: -10 } }}>
      {item.rotulo}
    </Badge>
  );
}

export default function Layout() {
  const { usuario, sair } = useAuth();
  const naoLidas = useNaoLidas();
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const painelCompleto = temAcessoAoPainel(usuario.perfil);
  const itensVisiveis = ITENS_MENU.filter((item) => painelCompleto || !item.apenasPainel);

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Abrir menu"
            onClick={() => setGavetaAberta(true)}
            sx={{ display: MENU_COMPACTO }}
          >
            <Badge badgeContent={naoLidas} color="error" variant="dot">
              <IconeMenu />
            </Badge>
          </IconButton>
          <Typography variant="h6" sx={{ mr: 3 }}>
            DistriSchool
          </Typography>
          <Box sx={{ display: MENU_COMPLETO, gap: 1 }}>
            {itensVisiveis.map((item) => (
              <Button
                key={item.caminho}
                component={NavLink}
                to={item.caminho}
                end={item.caminho === '/'}
                color="inherit"
                sx={{ '&.active': { bgcolor: 'rgba(255,255,255,0.15)' } }}
              >
                <Rotulo item={item} naoLidas={naoLidas} />
              </Button>
            ))}
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' } }}>
            {usuario.email}
          </Typography>
          <Chip label={NOMES_PERFIL[usuario.perfil]} size="small" sx={{ bgcolor: 'white' }} />
          <Button color="inherit" onClick={sair} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer open={gavetaAberta} onClose={() => setGavetaAberta(false)}>
        <Box sx={{ width: 260 }} role="navigation">
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="subtitle1">DistriSchool</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
              {usuario.email}
            </Typography>
          </Box>
          <Divider />
          <List>
            {itensVisiveis.map((item) => (
              <ListItemButton
                key={item.caminho}
                component={NavLink}
                to={item.caminho}
                end={item.caminho === '/'}
                onClick={() => setGavetaAberta(false)}
                sx={{ '&.active': { bgcolor: 'action.selected' } }}
              >
                <ListItemText primary={<Rotulo item={item} naoLidas={naoLidas} />} />
              </ListItemButton>
            ))}
          </List>
          <Divider />
          <List>
            <ListItemButton onClick={sair}>
              <ListItemText primary="Sair" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      <Container sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
        <Outlet />
      </Container>
    </>
  );
}
