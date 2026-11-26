import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { definirAoNaoAutorizado, lerToken, removerToken, salvarToken } from '../api/cliente';
import { buscarUsuarioLogado, fazerLogin } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // True while checking a token saved from a previous visit (avoids flashing the login page on F5)
  const [carregando, setCarregando] = useState(Boolean(lerToken()));

  const sair = useCallback(() => {
    removerToken();
    setUsuario(null);
  }, []);

  useEffect(() => {
    definirAoNaoAutorizado(() => setUsuario(null));

    if (!lerToken()) return;
    buscarUsuarioLogado()
      .then(setUsuario)
      .catch(sair)
      .finally(() => setCarregando(false));
  }, [sair]);

  const entrar = useCallback(async (email, senha) => {
    const { access_token } = await fazerLogin(email, senha);
    salvarToken(access_token);
    // Login only returns the token; email and profile come from /auth/me
    const dadosUsuario = await buscarUsuarioLogado();
    setUsuario(dadosUsuario);
    return dadosUsuario;
  }, []);

  // After verifying the email the profile changes on the server: fetch /auth/me again
  const recarregarUsuario = useCallback(async () => {
    if (!lerToken()) return;
    setUsuario(await buscarUsuarioLogado());
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair, recarregarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
