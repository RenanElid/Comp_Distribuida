import { Typography } from '@mui/material';
import { useAuth } from '../contexto/AuthContext';
import { NOMES_PERFIL, temAcessoAoPainel } from '../utils/permissoes';

export default function Inicio() {
  const { usuario } = useAuth();
  return (
    <>
      <Typography variant="h5" gutterBottom>
        Bem-vindo(a)
      </Typography>
      <Typography color="text.secondary">
        Você entrou como {usuario.email} ({NOMES_PERFIL[usuario.perfil]}).
      </Typography>
      {!temAcessoAoPainel(usuario.perfil) && (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Acompanhe notas e frequência pela página Notificações.
        </Typography>
      )}
    </>
  );
}
