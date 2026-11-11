from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from app.models import Matricula

class MatriculaRepository:
    def __init__(self, db: Session):
        self.db = db

    def buscar_por_id(self, matricula_id: int) -> Matricula | None:
        return self.db.get(Matricula, matricula_id)

    def buscar(self, aluno_id: int, turma_id: int) -> Matricula | None:
        return self.db.scalar(
            select(Matricula).where(Matricula.aluno_id == aluno_id, Matricula.turma_id == turma_id)
        )

    def buscar_no_ano_letivo(self, aluno_id: int, ano_letivo: int) -> Matricula | None:
        return self.db.scalar(
            select(Matricula).where(Matricula.aluno_id == aluno_id, Matricula.ano_letivo == ano_letivo)
        )

    def listar(self, aluno_id: int | None, turma_id: int | None) -> list[Matricula]:
        consulta = select(Matricula)
        if aluno_id:
            consulta = consulta.where(Matricula.aluno_id == aluno_id)
        if turma_id:
            consulta = consulta.where(Matricula.turma_id == turma_id)
        return list(self.db.scalars(consulta.order_by(Matricula.id)).all())

    def salvar(self, matricula: Matricula) -> Matricula:
        self.db.add(matricula)
        self.db.commit()
        self.db.refresh(matricula)
        return matricula

    def excluir(self, matricula: Matricula):
        self.db.delete(matricula)
        self.db.commit()

    def excluir_do_aluno(self, aluno_id: int) -> int:
        resultado = self.db.execute(delete(Matricula).where(Matricula.aluno_id == aluno_id))
        self.db.commit()
        return resultado.rowcount

    def excluir_da_turma(self, turma_id: int) -> int:
        resultado = self.db.execute(delete(Matricula).where(Matricula.turma_id == turma_id))
        self.db.commit()
        return resultado.rowcount
