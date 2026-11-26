from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.clients import user_service_client
from app.models import Atribuicao, Disciplina, Professor
from app.repositories.atribuicao_repository import AtribuicaoRepository
from app.repositories.disciplina_repository import DisciplinaRepository
from app.repositories.professor_repository import ProfessorRepository
from app.schemas.professor import ProfessorCreate, ProfessorUpdate

class ProfessorService:
    def __init__(self, db: Session):
        self.professor_repository = ProfessorRepository(db)
        self.atribuicao_repository = AtribuicaoRepository(db)
        self.disciplina_repository = DisciplinaRepository(db)

    def listar(self) -> list[Professor]:
        return self.professor_repository.listar()

    def buscar(self, professor_id: int) -> Professor:
        professor = self.professor_repository.buscar_por_id(professor_id)
        if professor is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Professor não encontrado")
        return professor

    def resolver_disciplinas(self, disciplina_ids: list[int]) -> list[Disciplina]:
        ids = set(disciplina_ids)
        disciplinas = self.disciplina_repository.buscar_varias(ids)
        faltando = ids - {disciplina.id for disciplina in disciplinas}
        if faltando:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT, f"Disciplinas não encontradas: {sorted(faltando)}"
            )
        return disciplinas

    def criar(self, dados: ProfessorCreate, token: str) -> Professor:
        disciplinas = self.resolver_disciplinas(dados.disciplina_ids)
        usuario_id = user_service_client.criar_usuario(dados.email, dados.senha, "TEACHER", token)
        professor = Professor(
            usuario_id=usuario_id,
            nome=dados.nome,
            qualificacao=dados.qualificacao,
            contato=dados.contato,
            disciplinas=disciplinas,
        )
        return self.professor_repository.salvar(professor)

    def atualizar(self, professor_id: int, dados: ProfessorUpdate) -> Professor:
        professor = self.buscar(professor_id)
        campos = dados.model_dump(exclude_none=True)
        disciplina_ids = campos.pop("disciplina_ids", None)
        if disciplina_ids is not None:
            novas = self.resolver_disciplinas(disciplina_ids)
            removidas = {d.id: d.nome for d in professor.disciplinas if d.id not in disciplina_ids}
            em_uso = {a.disciplina_id for a in self.atribuicao_repository.listar_do_professor(professor_id)}
            ainda_atribuidas = sorted(nome for disciplina_id, nome in removidas.items() if disciplina_id in em_uso)
            if ainda_atribuidas:
                raise HTTPException(
                    status.HTTP_409_CONFLICT,
                    f"O professor ainda dá {', '.join(ainda_atribuidas)} em alguma turma. "
                    "Remova essas atribuições antes de tirar a disciplina",
                )
            professor.disciplinas = novas
        for campo, valor in campos.items():
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
