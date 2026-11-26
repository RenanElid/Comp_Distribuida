import { useEffect, useRef, useState } from 'react';
import { Alert, CircularProgress, Link as LinkMui } from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import { verificarEmail } from '../api/endpoints';
import TelaPublica from '../componentes/TelaPublica';
import { useAuth } from '../contexto/AuthContext';

// Opened from the link in the email: /verificar-email?token=...
export default function VerificarEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { usuario, recarregarUsuario } = useAuth();
  const [resultado, setResultado] = useState(token ? null : { erro: 'Link incompleto' });
  // StrictMode runs effects twice in development; the check only needs to happen once
  const jaVerificou = useRef(false);

  useEffect(() => {
    if (!token || jaVerificou.current) return;
    jaVerificou.current = true;
    verificarEmail(token)
      .then((resposta) => {
        setResultado({ mensagem: resposta.mensagem });
        // Logged in on this browser: refresh the profile so the "email not verified" warning goes away
        recarregarUsuario().catch(() => {});
      })
      .catch((falha) => setResultado({ erro: falha.message }));
  }, [token, recarregarUsuario]);

  return (
    <TelaPublica titulo="Verificação de email">
      {!resultado && <CircularProgress />}
      {resultado?.mensagem && <Alert severity="success">{resultado.mensagem}</Alert>}
      {resultado?.erro && (
        <Alert severity="error">
          {resultado.erro}. O link vale por 24 horas: peça outro na página inicial do sistema.
        </Alert>
      )}
      <LinkMui component={Link} to={usuario ? '/' : '/login'} sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
        {usuario ? 'Ir para o início' : 'Ir para o login'}
      </LinkMui>
    </TelaPublica>
  );
}
