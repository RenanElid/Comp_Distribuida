from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import Nota

class NotaRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar_da_matricula(self, matricula_id: int) -> list[Nota]:
        consulta = select(Nota).where(Nota.matricula_id == matricula_id).order_by(Nota.id)
        return list(self.db.scalars(consulta).all())

    def salvar(self, nota: Nota) -> Nota:
        self.db.add(nota)
        self.db.commit()
        self.db.refresh(nota)
        return nota
