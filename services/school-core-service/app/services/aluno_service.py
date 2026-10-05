from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.clients import user_service_client
from app.eventos import publicar_evento
from app.models import Aluno
from app.repositories.aluno_repository import AlunoRepository
from app.schemas.aluno import AlunoCreate, AlunoPagina, AlunoUpdate


class AlunoService:
    def __init__(self, db: Session):
        self.aluno_repository = AlunoRepository(db)

    def listar(
        self, matricula: str | None, nome: str | None, turma_id: int | None, pagina: int, tamanho: int
    ) -> AlunoPagina:
        alunos, total = self.aluno_repository.listar(matricula, nome, turma_id, pagina, tamanho)
        return AlunoPagina(itens=alunos, total=total, pagina=pagina, tamanho=tamanho)

    def buscar(self, aluno_id: int) -> Aluno:
        aluno = self.aluno_repository.buscar_por_id(aluno_id)
        if aluno is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Aluno não encontrado")
        return aluno

    # Primeiro cria o login do aluno no user-service e depois grava o aluno no school_db.
    def criar(self, dados: AlunoCreate, token: str) -> Aluno:
        if self.aluno_repository.buscar_por_matricula(dados.matricula):
            raise HTTPException(status.HTTP_409_CONFLICT, "Matrícula já cadastrada")

        usuario_id = user_service_client.criar_usuario(dados.email, dados.senha, "STUDENT", token)
        aluno = Aluno(
            usuario_id=usuario_id,
            matricula=dados.matricula,
            nome=dados.nome,
            data_nascimento=dados.data_nascimento,
            endereco=dados.endereco,
            contato=dados.contato,
        )
        aluno = self.aluno_repository.salvar(aluno)

        publicar_evento("student.created", {"aluno_id": aluno.id, "usuario_id": usuario_id, "nome": aluno.nome})
        return aluno

    def atualizar(self, aluno_id: int, dados: AlunoUpdate) -> Aluno:
        aluno = self.buscar(aluno_id)

        if dados.matricula is not None and dados.matricula != aluno.matricula:
            if self.aluno_repository.buscar_por_matricula(dados.matricula):
                raise HTTPException(status.HTTP_409_CONFLICT, "Matrícula já cadastrada")

        for campo, valor in dados.model_dump(exclude_none=True).items():
            setattr(aluno, campo, valor)
        return self.aluno_repository.salvar(aluno)

    def excluir(self, aluno_id: int, token: str):
        aluno = self.buscar(aluno_id)
        user_service_client.desativar_usuario(aluno.usuario_id, token)
        self.aluno_repository.excluir(aluno)
