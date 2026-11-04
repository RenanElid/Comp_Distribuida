import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material';
import AlertaErro from './AlertaErro';

// Two-step dialog for records that cannot be edited or deleted later:
// step 1 shows the form (children), step 2 shows a summary and only then saves.
export default function DialogLancamento({
  aberto,
  titulo,
  confirmando,
  resumo,
  enviando,
  erro,
  aoFechar,
  aoRevisar,
  aoVoltar,
  aoConfirmar,
  children,
}) {
  return (
    <Dialog open={aberto} onClose={() => !enviando && aoFechar()} fullWidth maxWidth="sm">
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <AlertaErro erro={erro} sx={{ mt: 1 }} />
        {confirmando ? (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {resumo}
            <br />
            Depois de confirmar, não dá para editar nem excluir.
          </Alert>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {children}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        {confirmando ? (
          <>
            <Button onClick={aoVoltar} disabled={enviando}>
              Voltar e corrigir
            </Button>
            <Button variant="contained" onClick={aoConfirmar} disabled={enviando}>
              {enviando ? 'Gravando...' : 'Confirmar'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={aoFechar}>Cancelar</Button>
            <Button variant="contained" onClick={aoRevisar}>
              Revisar
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
