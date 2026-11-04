from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.clients import administrativo_client, alunos_client
from app.models import Matricula
from app.repositories.matricula_repository import MatriculaRepository
from app.schemas.matricula import MatriculaCreate

class MatriculaService:
    def __init__(self, db: Session):
        self.matricula_repository = MatriculaRepository(db)

    def listar(self, aluno_id: int | None, turma_id: int | None) -> list[Matricula]:
        return self.matricula_repository.listar(aluno_id, turma_id)

    def buscar(self, matricula_id: int) -> Matricula:
        matricula = self.matricula_repository.buscar_por_id(matricula_id)
        if matricula is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Matrícula não encontrada")
        return matricula

    def matricular(self, dados: MatriculaCreate, token: str) -> Matricula:
        alunos_client.verificar_aluno(dados.aluno_id, token)
        administrativo_client.verificar_turma(dados.turma_id, token)

        if self.matricula_repository.buscar(dados.aluno_id, dados.turma_id):
            raise HTTPException(status.HTTP_409_CONFLICT, "Aluno já matriculado nesta turma")

        matricula = Matricula(aluno_id=dados.aluno_id, turma_id=dados.turma_id)
        return self.matricula_repository.salvar(matricula)

    def cancelar(self, matricula_id: int):
        matricula = self.buscar(matricula_id)
        self.matricula_repository.excluir(matricula)
