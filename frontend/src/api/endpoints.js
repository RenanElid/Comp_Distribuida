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
