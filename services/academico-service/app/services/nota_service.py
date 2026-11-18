from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.clients import alunos_client
from app.eventos import publicar_evento
from app.models import Nota
from app.repositories.matricula_repository import MatriculaRepository
from app.repositories.nota_repository import NotaRepository
from app.schemas.nota import NotaCreate, NotasDaMatricula

class NotaService:
    def __init__(self, db: Session):
        self.nota_repository = NotaRepository(db)
        self.matricula_repository = MatriculaRepository(db)

    def lancar(self, dados: NotaCreate, token: str) -> Nota:
        matricula = self.matricula_repository.buscar_por_id(dados.matricula_id)
        if matricula is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Matrícula não encontrada")

        nota = Nota(
            matricula_id=dados.matricula_id,
            disciplina_id=dados.disciplina_id,
            descricao=dados.descricao,
            valor=dados.valor,
        )
        nota = self.nota_repository.salvar(nota)

        publicar_evento(
            "grade.recorded",
            {
                "nota_id": nota.id,
                "matricula_id": nota.matricula_id,
                "disciplina_id": nota.disciplina_id,
                "descricao": nota.descricao,
                "valor": float(nota.valor),
                "aluno_id": matricula.aluno_id,
                "destinatario_usuario_id": alunos_client.buscar_destinatario(matricula.aluno_id, token),
            },
        )
        return nota

    def listar_da_matricula(self, matricula_id: int, disciplina_id: int | None = None) -> NotasDaMatricula:
        if self.matricula_repository.buscar_por_id(matricula_id) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Matrícula não encontrada")

        notas = self.nota_repository.listar_da_matricula(matricula_id, disciplina_id)
        media = None
        if notas:
            media = round(sum(float(nota.valor) for nota in notas) / len(notas), 2)
        return NotasDaMatricula(matricula_id=matricula_id, disciplina_id=disciplina_id, notas=notas, media=media)
