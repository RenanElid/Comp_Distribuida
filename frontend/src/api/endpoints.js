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
// The optional filters are the same as the list page, so the export brings exactly what the search shows.
export async function listarTodosAlunos({ nome, matricula } = {}) {
  const TAMANHO_MAXIMO = 100;
  const primeira = await listarAlunos({ nome, matricula, pagina: 1, tamanho: TAMANHO_MAXIMO });
  const totalPaginas = Math.ceil(primeira.total / TAMANHO_MAXIMO);
  const restantes = await Promise.all(
    Array.from({ length: Math.max(totalPaginas - 1, 0) }, (_, i) =>
      listarAlunos({ nome, matricula, pagina: i + 2, tamanho: TAMANHO_MAXIMO })
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

// PARENT users for the "Responsável" field. GET /usuarios is ADMIN only, like the student form itself.
// One page of 100 is enough for the project; the route has no search by name.
export async function listarResponsaveis() {
  const pagina = await requisicao('/usuarios', { params: { perfil: 'PARENT', tamanho: 100 } });
  return pagina.itens.filter((usuario) => usuario.ativo);
}

export function listarProfessores() {
  return requisicao('/professores');
}

export function buscarProfessor(id) {
  return requisicao(`/professores/${id}`);
}

// Also creates the TEACHER login in the user-service (email and senha)
export function criarProfessor(dados) {
  return requisicao('/professores', { metodo: 'POST', corpo: dados });
}

export function atualizarProfessor(id, dados) {
  return requisicao(`/professores/${id}`, { metodo: 'PUT', corpo: dados });
}

// 409 while the teacher still has assignments
export function excluirProfessor(id) {
  return requisicao(`/professores/${id}`, { metodo: 'DELETE' });
}

export function listarAtribuicoesDoProfessor(id) {
  return requisicao(`/professores/${id}/atribuicoes`);
}

export function listarTurmas({ ano_letivo } = {}) {
  return requisicao('/turmas', { params: { ano_letivo } });
}

export function buscarTurma(id) {
  return requisicao(`/turmas/${id}`);
}

export function criarTurma(dados) {
  return requisicao('/turmas', { metodo: 'POST', corpo: dados });
}

export function atualizarTurma(id, dados) {
  return requisicao(`/turmas/${id}`, { metodo: 'PUT', corpo: dados });
}

// Publishes class.deleted: the academico-service then removes the enrollments of the class
export function excluirTurma(id) {
  return requisicao(`/turmas/${id}`, { metodo: 'DELETE' });
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

// Publishes teacher.assigned, which becomes a notification for the teacher
export function atribuirProfessor(turmaId, disciplina_id, professor_id) {
  return requisicao(`/turmas/${turmaId}/atribuicoes`, { metodo: 'POST', corpo: { disciplina_id, professor_id } });
}

export function removerAtribuicao(turmaId, atribuicaoId) {
  return requisicao(`/turmas/${turmaId}/atribuicoes/${atribuicaoId}`, { metodo: 'DELETE' });
}

export function listarDisciplinas() {
  return requisicao('/disciplinas');
}

export function criarDisciplina(dados) {
  return requisicao('/disciplinas', { metodo: 'POST', corpo: dados });
}

export function atualizarDisciplina(id, dados) {
  return requisicao(`/disciplinas/${id}`, { metodo: 'PUT', corpo: dados });
}

// Also removes the assignments of the subject (ON DELETE CASCADE in the administrativo_db)
export function excluirDisciplina(id) {
  return requisicao(`/disciplinas/${id}`, { metodo: 'DELETE' });
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

// 404: gateway without the route; 502/503/504: comunicacao-service stopped or not started
// (it only runs with "docker compose --profile comunicacao"). All mean the same to the user.
const STATUS_SERVICO_FORA = [404, 502, 503, 504];

export async function listarNotificacoes() {
  try {
    return await requisicao('/notificacoes');
  } catch (erro) {
    if (STATUS_SERVICO_FORA.includes(erro.status)) {
      throw new ErroApi(503, 'Serviço de notificações indisponível no momento');
    }
    throw erro;
  }
}

export function marcarNotificacaoComoLida(id) {
  return requisicao(`/notificacoes/${id}/lida`, { metodo: 'PATCH' });
}
