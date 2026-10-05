from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.clients import user_service_client
from app.models import Atribuicao, Professor
from app.repositories.atribuicao_repository import AtribuicaoRepository
from app.repositories.professor_repository import ProfessorRepository
from app.schemas.professor import ProfessorCreate, ProfessorUpdate


class ProfessorService:
    def __init__(self, db: Session):
        self.professor_repository = ProfessorRepository(db)
        self.atribuicao_repository = AtribuicaoRepository(db)

    def listar(self) -> list[Professor]:
        return self.professor_repository.listar()

    def buscar(self, professor_id: int) -> Professor:
        professor = self.professor_repository.buscar_por_id(professor_id)
        if professor is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Professor não encontrado")
        return professor

    def criar(self, dados: ProfessorCreate, token: str) -> Professor:
        usuario_id = user_service_client.criar_usuario(dados.email, dados.senha, "TEACHER", token)
        professor = Professor(
            usuario_id=usuario_id,
            nome=dados.nome,
            qualificacao=dados.qualificacao,
            contato=dados.contato,
        )
        return self.professor_repository.salvar(professor)

    def atualizar(self, professor_id: int, dados: ProfessorUpdate) -> Professor:
        professor = self.buscar(professor_id)
        for campo, valor in dados.model_dump(exclude_none=True).items():
            setattr(professor, campo, valor)
        return self.professor_repository.salvar(professor)

    def excluir(self, professor_id: int, token: str):
        professor = self.buscar(professor_id)
        if self.atribuicao_repository.listar_do_professor(professor_id):
            raise HTTPException(
                status.HTTP_409_CONFLICT, "Professor possui atribuições. Remova as atribuições antes de excluir"
            )

        user_service_client.desativar_usuario(professor.usuario_id, token)
        self.professor_repository.excluir(professor)

    def listar_atribuicoes(self, professor_id: int) -> list[Atribuicao]:
        self.buscar(professor_id)
        return self.atribuicao_repository.listar_do_professor(professor_id)
