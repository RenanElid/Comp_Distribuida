import { useState } from 'react';
import { Alert, Box, Button, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import {
  enviarVerificacaoEmail,
  listarAlunos,
  listarDisciplinas,
  listarProfessores,
  listarTurmas,
} from '../api/endpoints';
import { useAuth } from '../contexto/AuthContext';
import useCarregamento from '../hooks/useCarregamento';
import { NOMES_PERFIL, temAcessoAoPainel } from '../utils/permissoes';

// Users created by the forms start with email_verificado = false
function AvisoEmailNaoVerificado() {
  const [estado, setEstado] = useState({ enviando: false, mensagem: null, erro: null });

  async function enviar() {
    setEstado({ enviando: true, mensagem: null, erro: null });
    try {
      const resposta = await enviarVerificacaoEmail();
      setEstado({ enviando: false, mensagem: resposta.mensagem, erro: null });
    } catch (erro) {
      setEstado({ enviando: false, mensagem: null, erro: erro.message });
    }
  }

  return (
    <Alert
      severity={estado.erro ? 'error' : estado.mensagem ? 'success' : 'warning'}
      sx={{ mb: 2 }}
      action={
        !estado.mensagem && (
          <Button color="inherit" size="small" onClick={enviar} disabled={estado.enviando}>
            {estado.enviando ? 'Enviando...' : 'Enviar link'}
          </Button>
        )
      }
    >
      {estado.erro ?? estado.mensagem ?? 'Seu email ainda não foi verificado.'}
    </Alert>
  );
}

// One card per service: if a service is down, only its card shows "-"
function CartaoContagem({ titulo, caminho, carregar }) {
  const { dados, erro } = useCarregamento(carregar, []);
  return (
    <Card variant="outlined">
      <CardActionArea component={Link} to={caminho}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {titulo}
          </Typography>
          <Typography variant="h4">{erro ? '-' : (dados ?? '...')}</Typography>
          {erro && (
            <Typography variant="caption" color="error">
              Serviço indisponível
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

const CONTAGENS = [
  { titulo: 'Alunos', caminho: '/alunos', carregar: async () => (await listarAlunos({ pagina: 1, tamanho: 1 })).total },
  { titulo: 'Professores', caminho: '/professores', carregar: async () => (await listarProfessores()).length },
  { titulo: 'Turmas', caminho: '/turmas', carregar: async () => (await listarTurmas()).length },
  { titulo: 'Disciplinas', caminho: '/disciplinas', carregar: async () => (await listarDisciplinas()).length },
];

export default function Inicio() {
  const { usuario } = useAuth();
  return (
    <>
      {!usuario.email_verificado && <AvisoEmailNaoVerificado />}
      <Typography variant="h5" gutterBottom>
        Bem-vindo(a)
      </Typography>
      <Typography color="text.secondary">
        Você entrou como {usuario.email} ({NOMES_PERFIL[usuario.perfil]}).
      </Typography>
      {temAcessoAoPainel(usuario.perfil) && (
        <Box sx={{ display: 'grid', gap: 2, mt: 3, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
          {CONTAGENS.map((contagem) => (
            <CartaoContagem key={contagem.titulo} {...contagem} />
          ))}
        </Box>
      )}
      {!temAcessoAoPainel(usuario.perfil) && (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Acompanhe notas e frequência pela página Notificações.
        </Typography>
      )}
    </>
  );
}
