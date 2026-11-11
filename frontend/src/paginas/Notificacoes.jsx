import { Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { listarNotificacoes, marcarNotificacaoComoLida } from '../api/endpoints';
import AlertaErro from '../componentes/AlertaErro';
import useCarregamento from '../hooks/useCarregamento';
import { EVENTO_NOTIFICACOES_ALTERADAS } from '../hooks/useNaoLidas';
import { formatarDataHora } from '../utils/formatos';

const NOMES_TIPO = {
  NOTA_LANCADA: 'Nota',
  FREQUENCIA_REGISTRADA: 'Frequência',
  PROFESSOR_ATRIBUIDO: 'Atribuição',
};

export default function Notificacoes() {
  const { dados, carregando, erro, recarregar } = useCarregamento(listarNotificacoes, []);
  const [marcando, setMarcando] = useState(null);
  const [erroAoMarcar, setErroAoMarcar] = useState(null);

  async function marcarComoLida(id) {
    setMarcando(id);
    setErroAoMarcar(null);
    try {
      await marcarNotificacaoComoLida(id);
      recarregar();
      window.dispatchEvent(new Event(EVENTO_NOTIFICACOES_ALTERADAS));
    } catch (falha) {
      setErroAoMarcar(falha);
    } finally {
      setMarcando(null);
    }
  }

  // The API already returns only the logged user's notifications; newest first here just in case
  const notificacoes = [...(dados ?? [])].sort((a, b) => b.criada_em.localeCompare(a.criada_em));

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Notificações
      </Typography>
      <AlertaErro erro={erro} />
      <AlertaErro erro={erroAoMarcar} />

      {carregando && !dados && (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {dados && notificacoes.length === 0 && (
        <Typography color="text.secondary">Nenhuma notificação por enquanto.</Typography>
      )}

      <Stack spacing={1.5}>
        {notificacoes.map((notificacao) => (
          <Paper
            key={notificacao.id}
            variant="outlined"
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              borderLeft: 4,
              borderLeftColor: notificacao.lida ? 'divider' : 'primary.main',
              bgcolor: notificacao.lida ? 'transparent' : 'action.hover',
            }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Stack direction="row" spacing={1} sx={{ mb: 0.5, alignItems: 'center' }}>
                <Chip label={NOMES_TIPO[notificacao.tipo] ?? notificacao.tipo} size="small" />
                <Typography variant="caption" color="text.secondary">
                  {formatarDataHora(notificacao.criada_em)}
                </Typography>
              </Stack>
              <Typography sx={{ fontWeight: notificacao.lida ? 400 : 600 }}>{notificacao.mensagem}</Typography>
            </Box>
            {!notificacao.lida && (
              <Button size="small" onClick={() => marcarComoLida(notificacao.id)} disabled={marcando === notificacao.id}>
                Marcar como lida
              </Button>
            )}
          </Paper>
        ))}
      </Stack>
    </>
  );
}
