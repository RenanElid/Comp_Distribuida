from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.eventos import publicar_evento
from app.models import Frequencia
from app.repositories.frequencia_repository import FrequenciaRepository
from app.repositories.matricula_repository import MatriculaRepository
from app.schemas.frequencia import FrequenciaCreate

class FrequenciaService:
    def __init__(self, db: Session):
        self.frequencia_repository = FrequenciaRepository(db)
        self.matricula_repository = MatriculaRepository(db)

    def registrar(self, dados: FrequenciaCreate) -> Frequencia:
        if self.matricula_repository.buscar_por_id(dados.matricula_id) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Matrícula não encontrada")
        if self.frequencia_repository.buscar(dados.matricula_id, dados.data):
            raise HTTPException(status.HTTP_409_CONFLICT, "Frequência já registrada para esta matrícula neste dia")

        frequencia = Frequencia(matricula_id=dados.matricula_id, data=dados.data, situacao=dados.situacao)
        frequencia = self.frequencia_repository.salvar(frequencia)

        publicar_evento(
            "attendance.recorded",
            {
                "frequencia_id": frequencia.id,
                "matricula_id": frequencia.matricula_id,
                "data": frequencia.data.isoformat(),
                "situacao": frequencia.situacao,
            },
        )
        return frequencia

    def listar_da_matricula(self, matricula_id: int) -> list[Frequencia]:
        if self.matricula_repository.buscar_por_id(matricula_id) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Matrícula não encontrada")
        return self.frequencia_repository.listar_da_matricula(matricula_id)
