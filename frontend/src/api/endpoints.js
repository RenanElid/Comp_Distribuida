import { ErroApi, requisicao } from './cliente';

export function fazerLogin(email, senha) {
  return requisicao('/auth/login', { metodo: 'POST', corpo: { email, senha }, autenticado: false });
}

export function buscarUsuarioLogado() {
  return requisicao('/auth/me');
}

export function listarAlunos({ nome, matricula, pagina, tamanho }) {
  return requisicao('/alunos', { params: { nome, matricula, pagina, tamanho } });
}

// There is no GET /alunos?ids=..., so we fetch every student with the largest page the API allows.
// Cost: ceil(total / 100) requests, which grows with the school, not with the class size.
export async function listarTodosAlunos() {
  const TAMANHO_MAXIMO = 100;
  const primeira = await listarAlunos({ pagina: 1, tamanho: TAMANHO_MAXIMO });
  const totalPaginas = Math.ceil(primeira.total / TAMANHO_MAXIMO);
  const restantes = await Promise.all(
    Array.from({ length: Math.max(totalPaginas - 1, 0) }, (_, i) =>
      listarAlunos({ pagina: i + 2, tamanho: TAMANHO_MAXIMO })
    )
  );
  return [primeira, ...restantes].flatMap((pagina) => pagina.itens);
}

export function buscarAluno(id) {
  return requisicao(`/alunos/${id}`);
}

export function criarAluno(dados) {
  return requisicao('/alunos', { metodo: 'POST', corpo: dados });
}

export function atualizarAluno(id, dados) {
  return requisicao(`/alunos/${id}`, { metodo: 'PUT', corpo: dados });
}

export function excluirAluno(id) {
  return requisicao(`/alunos/${id}`, { metodo: 'DELETE' });
}

export function listarProfessores() {
  return requisicao('/professores');
}

export function listarTurmas({ ano_letivo } = {}) {
  return requisicao('/turmas', { params: { ano_letivo } });
}

export function buscarTurma(id) {
  return requisicao(`/turmas/${id}`);
}

export function listarMatriculas({ turma_id, aluno_id }) {
  return requisicao('/matriculas', { params: { turma_id, aluno_id } });
}

export function matricularAluno(aluno_id, turma_id) {
  return requisicao('/matriculas', { metodo: 'POST', corpo: { aluno_id, turma_id } });
}

export function cancelarMatricula(id) {
  return requisicao(`/matriculas/${id}`, { metodo: 'DELETE' });
}

export function listarAtribuicoesDaTurma(turmaId) {
  return requisicao(`/turmas/${turmaId}/atribuicoes`);
}

export function listarDisciplinas() {
  return requisicao('/disciplinas');
}

// Without disciplina_id: all grades of the enrollment (the per-subject averages are computed on the page)
export function listarNotas(matricula_id) {
  return requisicao('/notas', { params: { matricula_id } });
}

export function lancarNota(dados) {
  return requisicao('/notas', { metodo: 'POST', corpo: dados });
}

export function listarFrequencias(matricula_id) {
  return requisicao('/frequencias', { params: { matricula_id } });
}

export function registrarFrequencia(dados) {
  return requisicao('/frequencias', { metodo: 'POST', corpo: dados });
}

// TEMPORARY: local-only fake notifications to test the screen before the comunicacao-service exists.
// The file notificacoesFalsas.js is NOT in the repository (listed in .git/info/exclude), so on any other
// machine this glob finds nothing and the real API is always used. Remove this block once the service is up.
const modulosFalsos = import.meta.glob('./notificacoesFalsas.js', { eager: true });
const notificacoesFalsas =
  import.meta.env.VITE_NOTIFICACOES_FALSAS === 'true' ? modulosFalsos['./notificacoesFalsas.js'] : undefined;

export async function listarNotificacoes() {
  if (notificacoesFalsas) return notificacoesFalsas.listar();
  try {
    return await requisicao('/notificacoes');
  } catch (erro) {
    // A 404 on the list means the gateway has no route for it yet (comunicacao-service not deployed)
    if (erro.status === 404) throw new ErroApi(503, 'Serviço de notificações indisponível no momento');
    throw erro;
  }
}

export function marcarNotificacaoComoLida(id) {
  if (notificacoesFalsas) return notificacoesFalsas.marcarComoLida(id);
  return requisicao(`/notificacoes/${id}/lida`, { metodo: 'PATCH' });
}
