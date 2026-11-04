from datetime import date
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import Frequencia

class FrequenciaRepository:
    def __init__(self, db: Session):
        self.db = db

    def buscar(self, matricula_id: int, data: date) -> Frequencia | None:
        return self.db.scalar(
            select(Frequencia).where(Frequencia.matricula_id == matricula_id, Frequencia.data == data)
        )

    def listar_da_matricula(self, matricula_id: int) -> list[Frequencia]:
        consulta = select(Frequencia).where(Frequencia.matricula_id == matricula_id).order_by(Frequencia.data)
        return list(self.db.scalars(consulta).all())

    def salvar(self, frequencia: Frequencia) -> Frequencia:
        self.db.add(frequencia)
        self.db.commit()
        self.db.refresh(frequencia)
        return frequencia
