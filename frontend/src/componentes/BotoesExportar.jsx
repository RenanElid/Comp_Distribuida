import { useState } from 'react';
import { Button, Stack } from '@mui/material';
import { exportarCsv, exportarPdf } from '../utils/exportar';

// carregarLinhas runs only on click, so a page never fetches export data it may not use.
// The error goes back to the page through aoErro, to be shown in its own AlertaErro.
export default function BotoesExportar({ nomeArquivo, titulo, colunas, carregarLinhas, aoErro, paisagem }) {
  const [gerando, setGerando] = useState(null);

  async function gerar(formato) {
    setGerando(formato);
    aoErro?.(null);
    try {
      const linhas = await carregarLinhas();
      if (formato === 'csv') exportarCsv(nomeArquivo, colunas, linhas);
      else await exportarPdf(nomeArquivo, titulo, colunas, linhas, { paisagem });
    } catch (erro) {
      aoErro?.(erro);
    } finally {
      setGerando(null);
    }
  }

  return (
    <Stack direction="row" spacing={1}>
      <Button size="small" variant="outlined" onClick={() => gerar('csv')} disabled={Boolean(gerando)}>
        {gerando === 'csv' ? 'Gerando...' : 'Exportar CSV'}
      </Button>
      <Button size="small" variant="outlined" onClick={() => gerar('pdf')} disabled={Boolean(gerando)}>
        {gerando === 'pdf' ? 'Gerando...' : 'Exportar PDF'}
      </Button>
    </Stack>
  );
}
