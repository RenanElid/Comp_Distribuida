from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Professor


class ProfessorRepository:
    def __init__(self, db: Session):
        self.db = db

    def buscar_por_id(self, professor_id: int) -> Professor | None:
        return self.db.get(Professor, professor_id)

    def listar(self) -> list[Professor]:
        return list(self.db.scalars(select(Professor).order_by(Professor.nome)).all())

    def salvar(self, professor: Professor) -> Professor:
        self.db.add(professor)
        self.db.commit()
        self.db.refresh(professor)
        return professor

    def excluir(self, professor: Professor):
        self.db.delete(professor)
        self.db.commit()
