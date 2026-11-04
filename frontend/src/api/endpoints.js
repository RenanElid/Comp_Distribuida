import { requisicao } from './cliente';

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
