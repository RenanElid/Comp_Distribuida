import { useCallback, useEffect, useState } from 'react';
import { listarNotificacoes } from '../api/endpoints';

const INTERVALO_MS = 30000;
// Fired by the notifications page after marking one as read, so the counter updates at once
export const EVENTO_NOTIFICACOES_ALTERADAS = 'notificacoes-alteradas';

// Number of unread notifications, refreshed every 30s (polling).
// Returns null when the service is down: the menu simply hides the counter instead of showing an error.
export default function useNaoLidas() {
  const [quantidade, setQuantidade] = useState(null);

  const atualizar = useCallback(() => {
    listarNotificacoes()
      .then((lista) => setQuantidade(lista.filter((notificacao) => !notificacao.lida).length))
      .catch(() => setQuantidade(null));
  }, []);

  useEffect(() => {
    atualizar();
    const intervalo = setInterval(atualizar, INTERVALO_MS);
    window.addEventListener(EVENTO_NOTIFICACOES_ALTERADAS, atualizar);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener(EVENTO_NOTIFICACOES_ALTERADAS, atualizar);
    };
  }, [atualizar]);

  return quantidade;
}
