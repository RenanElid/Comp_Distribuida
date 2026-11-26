from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.clients import alunos_client
from app.eventos import publicar_evento
from app.models import Frequencia
from app.repositories.frequencia_repository import FrequenciaRepository
from app.repositories.matricula_repository import MatriculaRepository
from app.schemas.frequencia import ChamadaCreate, ChamadaResponse, FrequenciaCreate, ResumoFrequencia

class FrequenciaService:
    def __init__(self, db: Session):
        self.frequencia_repository = FrequenciaRepository(db)
        self.matricula_repository = MatriculaRepository(db)

    def registrar(self, dados: FrequenciaCreate, token: str) -> Frequencia:
        matricula = self.matricula_repository.buscar_por_id(dados.matricula_id)
        if matricula is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Matrícula não encontrada")
        if self.frequencia_repository.buscar(dados.matricula_id, dados.data):
            raise HTTPException(status.HTTP_409_CONFLICT, "Frequência já registrada para esta matrícula neste dia")

        frequencia = Frequencia(matricula_id=dados.matricula_id, data=dados.data, situacao=dados.situacao)
        frequencia = self.frequencia_repository.salvar(frequencia)
        self.publicar_registro(frequencia, matricula.aluno_id, token)
        return frequencia

    def publicar_registro(self, frequencia: Frequencia, aluno_id: int, token: str):
        aluno = alunos_client.buscar_para_evento(aluno_id, token)
        publicar_evento(
            "attendance.recorded",
            {
                "frequencia_id": frequencia.id,
                "matricula_id": frequencia.matricula_id,
                "data": frequencia.data.isoformat(),
                "situacao": frequencia.situacao,
                "aluno_id": aluno_id,
                "aluno_nome": aluno["nome"] if aluno else None,
                "destinatario_usuario_id": alunos_client.destinatario_do_aluno(aluno),
            },
        )

    def listar_chamada(self, turma_id: int, data: date) -> list[Frequencia]:
        return self.frequencia_repository.listar_da_turma_no_dia(turma_id, data)

    def registrar_chamada(self, dados: ChamadaCreate, token: str) -> ChamadaResponse:
        matriculas = {m.id: m for m in self.matricula_repository.listar(None, dados.turma_id)}
        ids_enviados = [registro.matricula_id for registro in dados.registros]
        if len(set(ids_enviados)) != len(ids_enviados):
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "A mesma matrícula aparece mais de uma vez")
        fora_da_turma = [matricula_id for matricula_id in ids_enviados if matricula_id not in matriculas]
        if fora_da_turma:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT, f"Matrículas que não são desta turma: {fora_da_turma}"
            )

        do_dia = self.frequencia_repository.listar_da_turma_no_dia(dados.turma_id, dados.data)
        ja_registradas = {frequencia.matricula_id for frequencia in do_dia}
        novas = [
            Frequencia(matricula_id=registro.matricula_id, data=dados.data, situacao=registro.situacao)
            for registro in dados.registros
            if registro.matricula_id not in ja_registradas
        ]
        try:
            novas = self.frequencia_repository.salvar_varias(novas)
        except IntegrityError:
            self.frequencia_repository.db.rollback()
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "Outra pessoa registrou a chamada deste dia ao mesmo tempo. Recarregue a página",
            )

        for frequencia in novas:
            self.publicar_registro(frequencia, matriculas[frequencia.matricula_id].aluno_id, token)
        return ChamadaResponse(registradas=novas, ja_registradas=sorted(ja_registradas & set(ids_enviados)))

    def resumo_da_turma(self, turma_id: int) -> list[ResumoFrequencia]:
        resumo = []
        for linha in self.frequencia_repository.resumo_da_turma(turma_id):
            percentual = None
            if linha.total:
                percentual = round((linha.presentes + linha.atrasos) * 100 / linha.total, 1)
            resumo.append(ResumoFrequencia(**linha._asdict(), percentual=percentual))
        return resumo

    def listar_da_matricula(self, matricula_id: int) -> list[Frequencia]:
        if self.matricula_repository.buscar_por_id(matricula_id) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Matrícula não encontrada")
        return self.frequencia_repository.listar_da_matricula(matricula_id)
