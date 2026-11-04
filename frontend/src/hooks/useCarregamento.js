import { useCallback, useEffect, useState } from 'react';

// Runs carregar() whenever the dependencies change and tracks loading/error.
// If the dependencies change before the previous call finishes, the old answer is ignored,
// so a slow response can never overwrite a newer one.
// recarregar() runs it again with the same dependencies (e.g. after a POST or DELETE).
export default function useCarregamento(carregar, dependencias) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: null });
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ignorar = false;
    setEstado((atual) => ({ ...atual, carregando: true, erro: null }));
    carregar()
      .then((dados) => {
        if (!ignorar) setEstado({ dados, carregando: false, erro: null });
      })
      .catch((erro) => {
        if (!ignorar) setEstado((atual) => ({ ...atual, carregando: false, erro }));
      });
    return () => {
      ignorar = true;
    };
    // carregar is a new function on every render; the caller lists what it really depends on
  }, [...dependencias, versao]);

  const recarregar = useCallback(() => setVersao((atual) => atual + 1), []);

  return { ...estado, recarregar };
}
