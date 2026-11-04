// "2010-05-03" -> "03/05/2010". new Date("2010-05-03") would read it as UTC midnight
// and show the previous day in UTC-3, so the string is split instead.
export function formatarData(dataIso) {
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

// 8.5 -> "8,5"
export function formatarNumero(valor) {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

// Today as "AAAA-MM-DD" in local time. Safe: the timezone bug only happens when PARSING
// a date string; the local getters below never go through UTC.
export function hojeIso() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

// Same formula as the backend: simple mean rounded to 2 decimals, null when empty
export function calcularMedia(valores) {
  if (valores.length === 0) return null;
  const soma = valores.reduce((total, valor) => total + valor, 0);
  return Math.round((soma / valores.length) * 100) / 100;
}
