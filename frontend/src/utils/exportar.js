// Shared by every "Exportar" button. colunas: [{ titulo: 'Nome', valor: (linha) => linha.nome }]

function baixar(conteudo, tipo, nomeArquivo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

function montarCelulas(linhas, colunas) {
  return linhas.map((linha) => colunas.map((coluna) => String(coluna.valor(linha) ?? '')));
}

// ";" and the BOM make Excel in Portuguese open the file in columns and with the accents right
export function exportarCsv(nomeArquivo, colunas, linhas) {
  const escapar = (texto) => (/[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto);
  const cabecalho = colunas.map((coluna) => escapar(coluna.titulo)).join(';');
  const corpo = montarCelulas(linhas, colunas).map((celulas) => celulas.map(escapar).join(';'));
  baixar('﻿' + [cabecalho, ...corpo].join('\r\n'), 'text/csv;charset=utf-8', `${nomeArquivo}.csv`);
}

// jsPDF is loaded only when someone exports, so it does not weigh on the first page load
export async function exportarPdf(nomeArquivo, titulo, colunas, linhas, { paisagem = false } = {}) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const documento = new jsPDF({ orientation: paisagem ? 'landscape' : 'portrait' });
  documento.setFontSize(14);
  documento.text(titulo, 14, 16);
  documento.setFontSize(9);
  documento.text(`Gerado em ${new Date().toLocaleString('pt-BR')} · ${linhas.length} registro(s)`, 14, 22);
  autoTable(documento, {
    startY: 27,
    head: [colunas.map((coluna) => coluna.titulo)],
    body: montarCelulas(linhas, colunas),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [25, 118, 210] },
  });
  documento.save(`${nomeArquivo}.pdf`);
}
