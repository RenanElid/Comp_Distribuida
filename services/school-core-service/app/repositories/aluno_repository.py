from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Aluno, Matricula


class AlunoRepository:
    def __init__(self, db: Session):
        self.db = db

    def buscar_por_id(self, aluno_id: int) -> Aluno | None:
        return self.db.get(Aluno, aluno_id)

    def buscar_por_matricula(self, matricula: str) -> Aluno | None:
        return self.db.scalar(select(Aluno).where(Aluno.matricula == matricula))

    def listar(
        self, matricula: str | None, nome: str | None, turma_id: int | None, pagina: int, tamanho: int
    ) -> tuple[list[Aluno], int]:
        consulta = select(Aluno)
        if matricula:
            consulta = consulta.where(Aluno.matricula == matricula)
        if nome:
            consulta = consulta.where(Aluno.nome.ilike(f"%{nome}%"))
        if turma_id:
            consulta = consulta.join(Matricula, Matricula.aluno_id == Aluno.id).where(Matricula.turma_id == turma_id)

        total = self.db.scalar(select(func.count()).select_from(consulta.subquery()))
        alunos = self.db.scalars(consulta.order_by(Aluno.nome).offset((pagina - 1) * tamanho).limit(tamanho)).all()
        return list(alunos), total

    def salvar(self, aluno: Aluno) -> Aluno:
        self.db.add(aluno)
        self.db.commit()
        self.db.refresh(aluno)
        return aluno

    def excluir(self, aluno: Aluno):
        self.db.delete(aluno)
        self.db.commit()
