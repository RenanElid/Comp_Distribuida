const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
const CHAVE_TOKEN = 'distrischool_token';
// The academico-service retries up to 3 times with a 3s timeout each, so 10s still fits one full attempt cycle
const TEMPO_LIMITE_MS = 10000;

export class ErroApi extends Error {
  // campos: {nome_do_campo: "mensagem"} for 422 errors, null otherwise
  constructor(status, mensagem, campos = null) {
    super(mensagem);
    this.status = status;
    this.campos = campos;
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

// Pydantic messages come in English; the "type" code is stable, so translate by it
function traduzirErroDeCampo(erro) {
  const ctx = erro.ctx ?? {};
  // An empty value fails with different types (pattern, min length, date); all mean "required"
  if (erro.type === 'missing' || erro.input === '' || erro.input === null) return 'Campo obrigatório';
  if (erro.type === 'string_too_short') return `Mínimo de ${ctx.min_length} caracteres`;
  if (erro.type === 'string_too_long') return `Máximo de ${ctx.max_length} caracteres`;
  if (erro.type === 'greater_than_equal') return `Deve ser no mínimo ${ctx.ge}`;
  if (erro.type === 'less_than_equal') return `Deve ser no máximo ${ctx.le}`;
  if (erro.type?.startsWith('float') || erro.type?.startsWith('int')) return 'Número inválido';
  if (erro.type === 'literal_error') return 'Valor inválido';
  // The only regex in the schemas is the email one
  if (erro.type === 'string_pattern_mismatch') return 'Email inválido';
  if (erro.type?.startsWith('date')) return 'Data inválida';
  return erro.msg;
}

function nomeDoCampo(erro) {
  return (erro.loc ?? []).filter((parte) => parte !== 'body').join('.');
}

// 422 -> {"email": "Email inválido", ...}; errors without a field name are left out
function extrairCampos(corpo) {
  const detail = corpo?.detail;
  if (!Array.isArray(detail)) return null;
  const campos = {};
  detail.forEach((erro) => {
    const campo = nomeDoCampo(erro);
    if (campo && !campos[campo]) campos[campo] = traduzirErroDeCampo(erro);
  });
  return Object.keys(campos).length ? campos : null;
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
        const campo = nomeDoCampo(erro);
        const mensagem = traduzirErroDeCampo(erro);
        return campo ? `${campo}: ${mensagem}` : mensagem;
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
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
  } catch (erro) {
    if (erro.name === 'TimeoutError') {
      // On a write the backend may have saved it before the timeout; retrying blindly could duplicate a grade
      if (metodo !== 'GET') {
        throw new ErroApi(0, 'O servidor demorou para responder e não sabemos se a operação foi gravada. Confira antes de tentar de novo.');
      }
      throw new ErroApi(0, 'O servidor demorou para responder. Tente novamente.');
    }
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
    throw new ErroApi(resposta.status, extrairMensagem(resposta.status, dados), extrairCampos(dados));
  }
  return dados;
}
