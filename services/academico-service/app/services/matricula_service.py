from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
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
        alunos_client.buscar_aluno(dados.aluno_id, token)
        turma = administrativo_client.buscar_turma(dados.turma_id, token)

        if self.matricula_repository.buscar(dados.aluno_id, dados.turma_id):
            raise HTTPException(status.HTTP_409_CONFLICT, "Aluno já matriculado nesta turma")
        if self.matricula_repository.buscar_no_ano_letivo(dados.aluno_id, turma["ano_letivo"]):
            raise HTTPException(status.HTTP_409_CONFLICT, "Aluno já matriculado em outra turma neste ano letivo")

        matricula = Matricula(aluno_id=dados.aluno_id, turma_id=dados.turma_id, ano_letivo=turma["ano_letivo"])
        try:
            return self.matricula_repository.salvar(matricula)
        except IntegrityError:
            self.matricula_repository.db.rollback()
            raise HTTPException(status.HTTP_409_CONFLICT, "Aluno já matriculado nesta turma ou neste ano letivo")

    def cancelar(self, matricula_id: int):
        matricula = self.buscar(matricula_id)
        self.matricula_repository.excluir(matricula)
