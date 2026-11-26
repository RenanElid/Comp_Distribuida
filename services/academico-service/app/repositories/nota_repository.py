from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models import Matricula, Nota

class NotaRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar_da_matricula(self, matricula_id: int, disciplina_id: int | None = None) -> list[Nota]:
        consulta = select(Nota).where(Nota.matricula_id == matricula_id)
        if disciplina_id is not None:
            consulta = consulta.where(Nota.disciplina_id == disciplina_id)
        return list(self.db.scalars(consulta.order_by(Nota.id)).all())

    def resumo_da_turma(self, turma_id: int) -> list:
        consulta = (
            select(
                Matricula.id.label("matricula_id"),
                Matricula.aluno_id,
                Nota.disciplina_id,
                func.count(Nota.id).label("quantidade"),
                func.avg(Nota.valor).label("media"),
            )
            .join(Nota, Nota.matricula_id == Matricula.id)
            .where(Matricula.turma_id == turma_id)
            .group_by(Matricula.id, Matricula.aluno_id, Nota.disciplina_id)
            .order_by(Matricula.id, Nota.disciplina_id)
        )
        return list(self.db.execute(consulta).all())

    def salvar(self, nota: Nota) -> Nota:
        self.db.add(nota)
        self.db.commit()
        self.db.refresh(nota)
        return nota
