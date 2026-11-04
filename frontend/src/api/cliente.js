const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
const CHAVE_TOKEN = 'distrischool_token';

export class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

export function lerToken() {
  return localStorage.getItem(CHAVE_TOKEN);
}

export function salvarToken(token) {
  localStorage.setItem(CHAVE_TOKEN, token);
}

export function removerToken() {
  localStorage.removeItem(CHAVE_TOKEN);
}

// The AuthContext registers here what to do on a 401 (clear the user state),
// so this file does not need to know about React.
let aoNaoAutorizado = null;

export function definirAoNaoAutorizado(funcao) {
  aoNaoAutorizado = funcao;
}

// FastAPI sends two error shapes:
//   422 -> {detail: [{loc: ["body", "email"], msg: "...", type: "..."}]}
//   others -> {detail: "texto"}
function extrairMensagem(status, corpo) {
  if (status === 403) return 'Sem permissão para esta ação';

  const detail = corpo?.detail;
  if (Array.isArray(detail)) {
    return detail
      .map((erro) => {
        const campo = (erro.loc ?? []).filter((parte) => parte !== 'body').join('.');
        return campo ? `${campo}: ${erro.msg}` : erro.msg;
      })
      .join(' | ');
  }
  if (typeof detail === 'string') return detail;

  // Nginx answers 502/504 with HTML when a service is down, so there is no detail
  if (status >= 502 && status <= 504) return 'Serviço indisponível no momento';
  return `Erro inesperado (${status})`;
}

function montarUrl(caminho, params) {
  const url = new URL(BASE_URL + caminho);
  Object.entries(params ?? {}).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(chave, valor);
  });
  return url;
}

export async function requisicao(caminho, { metodo = 'GET', corpo, params, autenticado = true } = {}) {
  const headers = {};
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  const token = lerToken();
  if (autenticado && token) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(montarUrl(caminho, params), {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    // fetch only throws on network failure (gateway down, CORS blocked)
    throw new ErroApi(0, 'Não foi possível conectar ao servidor');
  }

  if (resposta.status === 204) return null;

  const texto = await resposta.text();
  let dados = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    dados = null;
  }

  if (!resposta.ok) {
    // On login a 401 means wrong password, not an expired session
    if (resposta.status === 401 && autenticado) {
      removerToken();
      aoNaoAutorizado?.();
    }
    throw new ErroApi(resposta.status, extrairMensagem(resposta.status, dados));
  }
  return dados;
}
