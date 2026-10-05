from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Aluno, Matricula


class MatriculaRepository:
    def __init__(self, db: Session):
        self.db = db

    def buscar(self, turma_id: int, aluno_id: int) -> Matricula | None:
        return self.db.scalar(
            select(Matricula).where(Matricula.turma_id == turma_id, Matricula.aluno_id == aluno_id)
        )

    def listar_alunos_da_turma(self, turma_id: int) -> list[Aluno]:
        consulta = (
            select(Aluno)
            .join(Matricula, Matricula.aluno_id == Aluno.id)
            .where(Matricula.turma_id == turma_id)
            .order_by(Aluno.nome)
        )
        return list(self.db.scalars(consulta).all())

    def salvar(self, matricula: Matricula) -> Matricula:
        self.db.add(matricula)
        self.db.commit()
        self.db.refresh(matricula)
        return matricula

    def excluir(self, matricula: Matricula):
        self.db.delete(matricula)
        self.db.commit()
