// Mirrors the backend rules only to hide buttons. The backend is the one that blocks.

export function temAcessoAoPainel(perfil) {
  return perfil === 'ADMIN' || perfil === 'TEACHER';
}

export function podeEditarAlunos(perfil) {
  return perfil === 'ADMIN';
}

export function podeGerenciarMatriculas(perfil) {
  return perfil === 'ADMIN' || perfil === 'TEACHER';
}

export function podeLancarNotasEFrequencia(perfil) {
  return perfil === 'ADMIN' || perfil === 'TEACHER';
}

export const NOMES_PERFIL = {
  ADMIN: 'Administrador',
  TEACHER: 'Professor',
  STUDENT: 'Aluno',
  PARENT: 'Responsável',
};
