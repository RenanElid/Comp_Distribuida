from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Aluno, Turma
from app.repositories.matricula_repository import MatriculaRepository
from app.repositories.turma_repository import TurmaRepository
from app.schemas.turma import TurmaCreate, TurmaUpdate


class TurmaService:
    def __init__(self, db: Session):
        self.turma_repository = TurmaRepository(db)
        self.matricula_repository = MatriculaRepository(db)

    def listar(self, ano_letivo: int | None) -> list[Turma]:
        return self.turma_repository.listar(ano_letivo)

    def buscar(self, turma_id: int) -> Turma:
        turma = self.turma_repository.buscar_por_id(turma_id)
        if turma is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Turma não encontrada")
        return turma

    def criar(self, dados: TurmaCreate) -> Turma:
        turma = Turma(nome=dados.nome, ano_letivo=dados.ano_letivo, turno=dados.turno)
        return self.turma_repository.salvar(turma)

    def atualizar(self, turma_id: int, dados: TurmaUpdate) -> Turma:
        turma = self.buscar(turma_id)
        for campo, valor in dados.model_dump(exclude_none=True).items():
            setattr(turma, campo, valor)
        return self.turma_repository.salvar(turma)

    def excluir(self, turma_id: int):
        turma = self.buscar(turma_id)
        self.turma_repository.excluir(turma)

    def listar_alunos(self, turma_id: int) -> list[Aluno]:
        self.buscar(turma_id)
        return self.matricula_repository.listar_alunos_da_turma(turma_id)
