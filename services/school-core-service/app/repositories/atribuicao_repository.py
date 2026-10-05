from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Atribuicao


class AtribuicaoRepository:
    def __init__(self, db: Session):
        self.db = db

    def buscar_por_id(self, atribuicao_id: int) -> Atribuicao | None:
        return self.db.get(Atribuicao, atribuicao_id)

    def buscar_por_turma_e_disciplina(self, turma_id: int, disciplina_id: int) -> Atribuicao | None:
        return self.db.scalar(
            select(Atribuicao).where(Atribuicao.turma_id == turma_id, Atribuicao.disciplina_id == disciplina_id)
        )

    def listar_da_turma(self, turma_id: int) -> list[Atribuicao]:
        return list(self.db.scalars(select(Atribuicao).where(Atribuicao.turma_id == turma_id)).all())

    def listar_do_professor(self, professor_id: int) -> list[Atribuicao]:
        return list(self.db.scalars(select(Atribuicao).where(Atribuicao.professor_id == professor_id)).all())

    def salvar(self, atribuicao: Atribuicao) -> Atribuicao:
        self.db.add(atribuicao)
        self.db.commit()
        self.db.refresh(atribuicao)
        return atribuicao

    def excluir(self, atribuicao: Atribuicao):
        self.db.delete(atribuicao)
        self.db.commit()
