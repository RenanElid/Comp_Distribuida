from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Disciplina
from app.repositories.disciplina_repository import DisciplinaRepository
from app.schemas.disciplina import DisciplinaCreate, DisciplinaUpdate


class DisciplinaService:
    def __init__(self, db: Session):
        self.disciplina_repository = DisciplinaRepository(db)

    def listar(self) -> list[Disciplina]:
        return self.disciplina_repository.listar()

    def buscar(self, disciplina_id: int) -> Disciplina:
        disciplina = self.disciplina_repository.buscar_por_id(disciplina_id)
        if disciplina is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Disciplina não encontrada")
        return disciplina

    def criar(self, dados: DisciplinaCreate) -> Disciplina:
        disciplina = Disciplina(nome=dados.nome, carga_horaria=dados.carga_horaria)
        return self.disciplina_repository.salvar(disciplina)

    def atualizar(self, disciplina_id: int, dados: DisciplinaUpdate) -> Disciplina:
        disciplina = self.buscar(disciplina_id)
        for campo, valor in dados.model_dump(exclude_none=True).items():
            setattr(disciplina, campo, valor)
        return self.disciplina_repository.salvar(disciplina)

    def excluir(self, disciplina_id: int):
        disciplina = self.buscar(disciplina_id)
        self.disciplina_repository.excluir(disciplina)
