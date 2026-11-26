import { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { atualizarTurma, criarTurma } from '../api/endpoints';
import { NOMES_TURNO } from '../utils/formatos';
import AlertaErro from './AlertaErro';

function valoresIniciais(turma) {
  return turma
    ? { nome: turma.nome, ano_letivo: String(turma.ano_letivo), turno: turma.turno }
    : { nome: '', ano_letivo: String(new Date().getFullYear()), turno: 'MANHA' };
}

// Create (turma undefined) or edit a class. aoSalvar receives the saved class.
export default function TurmaDialog({ aberto, turma, aoFechar, aoSalvar }) {
  const [valores, setValores] = useState(valoresIniciais(turma));
  const [errosCampos, setErrosCampos] = useState({});
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Each time the dialog opens it starts from the class being edited (or empty)
  useEffect(() => {
    if (!aberto) return;
    setValores(valoresIniciais(turma));
    setErrosCampos({});
    setErro(null);
  }, [aberto, turma]);

  function alterar(campo) {
    return (evento) => {
      setValores((atuais) => ({ ...atuais, [campo]: evento.target.value }));
      setErrosCampos((atuais) => ({ ...atuais, [campo]: undefined }));
    };
  }

  async function salvar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    setErrosCampos({});
    // "" goes as null so the backend answers 422 "Campo obrigatório" instead of a number error
    const corpo = {
      nome: valores.nome.trim(),
      ano_letivo: valores.ano_letivo === '' ? null : Number(valores.ano_letivo),
      turno: valores.turno,
    };
    try {
      const salva = turma ? await atualizarTurma(turma.id, corpo) : await criarTurma(corpo);
      aoSalvar(salva);
    } catch (falha) {
      setErrosCampos(falha.campos ?? {});
      setErro(falha.campos ? 'Corrija os campos destacados' : falha);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onClose={() => !enviando && aoFechar()} fullWidth maxWidth="xs">
      <form onSubmit={salvar} noValidate>
        <DialogTitle>{turma ? 'Editar turma' : 'Nova turma'}</DialogTitle>
        <DialogContent>
          <AlertaErro erro={erro} sx={{ mt: 1 }} />
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nome"
              required
              value={valores.nome}
              onChange={alterar('nome')}
              error={Boolean(errosCampos.nome)}
              helperText={errosCampos.nome ?? 'Ex.: 9o Ano C'}
              disabled={enviando}
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <TextField
              label="Ano letivo"
              type="number"
              required
              value={valores.ano_letivo}
              onChange={alterar('ano_letivo')}
              error={Boolean(errosCampos.ano_letivo)}
              helperText={errosCampos.ano_letivo}
              disabled={enviando}
            />
            <TextField
              select
              label="Turno"
              required
              value={valores.turno}
              onChange={alterar('turno')}
              error={Boolean(errosCampos.turno)}
              helperText={errosCampos.turno}
              disabled={enviando}
            >
              {Object.entries(NOMES_TURNO).map(([valor, rotulo]) => (
                <MenuItem key={valor} value={valor}>
                  {rotulo}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={aoFechar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
