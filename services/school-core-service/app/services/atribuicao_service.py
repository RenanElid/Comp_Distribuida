from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.eventos import publicar_evento
from app.models import Atribuicao
from app.repositories.atribuicao_repository import AtribuicaoRepository
from app.repositories.disciplina_repository import DisciplinaRepository
from app.repositories.professor_repository import ProfessorRepository
from app.repositories.turma_repository import TurmaRepository
from app.schemas.turma import AtribuicaoCreate


class AtribuicaoService:
    def __init__(self, db: Session):
        self.atribuicao_repository = AtribuicaoRepository(db)
        self.turma_repository = TurmaRepository(db)
        self.disciplina_repository = DisciplinaRepository(db)
        self.professor_repository = ProfessorRepository(db)

    def listar_da_turma(self, turma_id: int) -> list[Atribuicao]:
        if self.turma_repository.buscar_por_id(turma_id) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Turma não encontrada")
        return self.atribuicao_repository.listar_da_turma(turma_id)

    # Define qual professor dá uma disciplina na turma (só um professor por disciplina em cada turma).
    def atribuir(self, turma_id: int, dados: AtribuicaoCreate) -> Atribuicao:
        if self.turma_repository.buscar_por_id(turma_id) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Turma não encontrada")
        if self.disciplina_repository.buscar_por_id(dados.disciplina_id) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Disciplina não encontrada")
        if self.professor_repository.buscar_por_id(dados.professor_id) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Professor não encontrado")
        if self.atribuicao_repository.buscar_por_turma_e_disciplina(turma_id, dados.disciplina_id):
            raise HTTPException(status.HTTP_409_CONFLICT, "Esta disciplina já tem professor nesta turma")

        atribuicao = Atribuicao(
            turma_id=turma_id,
            disciplina_id=dados.disciplina_id,
            professor_id=dados.professor_id,
        )
        atribuicao = self.atribuicao_repository.salvar(atribuicao)

        publicar_evento(
            "teacher.assigned",
            {"professor_id": atribuicao.professor_id, "turma_id": turma_id, "disciplina_id": atribuicao.disciplina_id},
        )
        return atribuicao

    def remover(self, turma_id: int, atribuicao_id: int):
        atribuicao = self.atribuicao_repository.buscar_por_id(atribuicao_id)
        if atribuicao is None or atribuicao.turma_id != turma_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Atribuição não encontrada")
        self.atribuicao_repository.excluir(atribuicao)
