from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Matricula
from app.repositories.aluno_repository import AlunoRepository
from app.repositories.matricula_repository import MatriculaRepository
from app.repositories.turma_repository import TurmaRepository


class MatriculaService:
    def __init__(self, db: Session):
        self.matricula_repository = MatriculaRepository(db)
        self.aluno_repository = AlunoRepository(db)
        self.turma_repository = TurmaRepository(db)

    def matricular(self, turma_id: int, aluno_id: int) -> Matricula:
        if self.turma_repository.buscar_por_id(turma_id) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Turma não encontrada")
        if self.aluno_repository.buscar_por_id(aluno_id) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Aluno não encontrado")
        if self.matricula_repository.buscar(turma_id, aluno_id):
            raise HTTPException(status.HTTP_409_CONFLICT, "Aluno já matriculado nesta turma")

        return self.matricula_repository.salvar(Matricula(turma_id=turma_id, aluno_id=aluno_id))

    def cancelar(self, turma_id: int, aluno_id: int):
        matricula = self.matricula_repository.buscar(turma_id, aluno_id)
        if matricula is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Matrícula não encontrada")
        self.matricula_repository.excluir(matricula)
