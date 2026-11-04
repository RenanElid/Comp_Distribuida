from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import Nota

class NotaRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar_da_matricula(self, matricula_id: int, disciplina_id: int | None = None) -> list[Nota]:
        consulta = select(Nota).where(Nota.matricula_id == matricula_id)
        if disciplina_id is not None:
            consulta = consulta.where(Nota.disciplina_id == disciplina_id)
        return list(self.db.scalars(consulta.order_by(Nota.id)).all())

    def salvar(self, nota: Nota) -> Nota:
        self.db.add(nota)
        self.db.commit()
        self.db.refresh(nota)
        return nota
