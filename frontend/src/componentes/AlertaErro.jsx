import { Alert } from '@mui/material';

export default function AlertaErro({ erro, sx }) {
  if (!erro) return null;
  const mensagem = typeof erro === 'string' ? erro : erro.message;
  return (
    <Alert severity="error" sx={{ mb: 2, ...sx }}>
      {mensagem}
    </Alert>
  );
}
