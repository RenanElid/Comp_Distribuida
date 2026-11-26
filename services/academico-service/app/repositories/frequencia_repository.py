from datetime import date
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session
from app.models import Frequencia, Matricula

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

    def listar_da_turma_no_dia(self, turma_id: int, data: date) -> list[Frequencia]:
        consulta = (
            select(Frequencia)
            .join(Matricula, Matricula.id == Frequencia.matricula_id)
            .where(Matricula.turma_id == turma_id, Frequencia.data == data)
            .order_by(Frequencia.matricula_id)
        )
        return list(self.db.scalars(consulta).all())

    def resumo_da_turma(self, turma_id: int) -> list:
        def contar(situacao: str):
            return func.count(case((Frequencia.situacao == situacao, 1)))

        consulta = (
            select(
                Matricula.id.label("matricula_id"),
                Matricula.aluno_id,
                func.count(Frequencia.id).label("total"),
                contar("PRESENTE").label("presentes"),
                contar("ATRASO").label("atrasos"),
                contar("FALTA").label("faltas"),
            )
            .outerjoin(Frequencia, Frequencia.matricula_id == Matricula.id)
            .where(Matricula.turma_id == turma_id)
            .group_by(Matricula.id, Matricula.aluno_id)
            .order_by(Matricula.id)
        )
        return list(self.db.execute(consulta).all())

    def salvar_varias(self, frequencias: list[Frequencia]) -> list[Frequencia]:
        self.db.add_all(frequencias)
        self.db.commit()
        for frequencia in frequencias:
            self.db.refresh(frequencia)
        return frequencias

    def salvar(self, frequencia: Frequencia) -> Frequencia:
        self.db.add(frequencia)
        self.db.commit()
        self.db.refresh(frequencia)
        return frequencia
