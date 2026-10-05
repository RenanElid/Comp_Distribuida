from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Turma


class TurmaRepository:
    def __init__(self, db: Session):
        self.db = db

    def buscar_por_id(self, turma_id: int) -> Turma | None:
        return self.db.get(Turma, turma_id)

    def listar(self, ano_letivo: int | None) -> list[Turma]:
        consulta = select(Turma)
        if ano_letivo:
            consulta = consulta.where(Turma.ano_letivo == ano_letivo)
        return list(self.db.scalars(consulta.order_by(Turma.ano_letivo, Turma.nome)).all())

    def salvar(self, turma: Turma) -> Turma:
        self.db.add(turma)
        self.db.commit()
        self.db.refresh(turma)
        return turma

    def excluir(self, turma: Turma):
        self.db.delete(turma)
        self.db.commit()
