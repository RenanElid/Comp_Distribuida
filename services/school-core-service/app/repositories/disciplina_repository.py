from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Disciplina


class DisciplinaRepository:
    def __init__(self, db: Session):
        self.db = db

    def buscar_por_id(self, disciplina_id: int) -> Disciplina | None:
        return self.db.get(Disciplina, disciplina_id)

    def listar(self) -> list[Disciplina]:
        return list(self.db.scalars(select(Disciplina).order_by(Disciplina.nome)).all())

    def salvar(self, disciplina: Disciplina) -> Disciplina:
        self.db.add(disciplina)
        self.db.commit()
        self.db.refresh(disciplina)
        return disciplina

    def excluir(self, disciplina: Disciplina):
        self.db.delete(disciplina)
        self.db.commit()
