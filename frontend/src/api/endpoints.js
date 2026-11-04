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
