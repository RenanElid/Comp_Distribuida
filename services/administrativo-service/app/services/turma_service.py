from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.eventos import publicar_evento
from app.models import Turma
from app.repositories.turma_repository import TurmaRepository
from app.schemas.turma import TurmaCreate, TurmaUpdate

class TurmaService:
    def __init__(self, db: Session):
        self.turma_repository = TurmaRepository(db)

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

        publicar_evento("class.deleted", {"turma_id": turma_id})
