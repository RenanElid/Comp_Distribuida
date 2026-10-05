from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.aluno import AlunoResponse
from app.schemas.turma import (
    AtribuicaoCreate,
    AtribuicaoResponse,
    MatriculaCreate,
    MatriculaResponse,
    TurmaCreate,
    TurmaResponse,
    TurmaUpdate,
)
from app.security import admin_ou_professor, apenas_admin, usuario_logado
from app.services.atribuicao_service import AtribuicaoService
from app.services.matricula_service import MatriculaService
from app.services.turma_service import TurmaService

router = APIRouter(prefix="/turmas", tags=["Turmas"])


@router.get("", response_model=list[TurmaResponse], dependencies=[Depends(usuario_logado)])
def listar_turmas(ano_letivo: int | None = None, db: Session = Depends(get_db)):
    return TurmaService(db).listar(ano_letivo)


@router.get("/{turma_id}", response_model=TurmaResponse, dependencies=[Depends(usuario_logado)])
def buscar_turma(turma_id: int, db: Session = Depends(get_db)):
    return TurmaService(db).buscar(turma_id)


@router.post(
    "", response_model=TurmaResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(apenas_admin)]
)
def criar_turma(dados: TurmaCreate, db: Session = Depends(get_db)):
    return TurmaService(db).criar(dados)


@router.put("/{turma_id}", response_model=TurmaResponse, dependencies=[Depends(apenas_admin)])
def atualizar_turma(turma_id: int, dados: TurmaUpdate, db: Session = Depends(get_db)):
    return TurmaService(db).atualizar(turma_id, dados)


@router.delete("/{turma_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(apenas_admin)])
def excluir_turma(turma_id: int, db: Session = Depends(get_db)):
    TurmaService(db).excluir(turma_id)


@router.get("/{turma_id}/alunos", response_model=list[AlunoResponse], dependencies=[Depends(admin_ou_professor)])
def listar_alunos_da_turma(turma_id: int, db: Session = Depends(get_db)):
    return TurmaService(db).listar_alunos(turma_id)


@router.post(
    "/{turma_id}/alunos",
    response_model=MatriculaResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(apenas_admin)],
)
def matricular_aluno(turma_id: int, dados: MatriculaCreate, db: Session = Depends(get_db)):
    return MatriculaService(db).matricular(turma_id, dados.aluno_id)


@router.delete(
    "/{turma_id}/alunos/{aluno_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(apenas_admin)]
)
def cancelar_matricula(turma_id: int, aluno_id: int, db: Session = Depends(get_db)):
    MatriculaService(db).cancelar(turma_id, aluno_id)


@router.get(
    "/{turma_id}/atribuicoes", response_model=list[AtribuicaoResponse], dependencies=[Depends(usuario_logado)]
)
def listar_atribuicoes_da_turma(turma_id: int, db: Session = Depends(get_db)):
    return AtribuicaoService(db).listar_da_turma(turma_id)


@router.post(
    "/{turma_id}/atribuicoes",
    response_model=AtribuicaoResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(apenas_admin)],
)
def atribuir_professor(turma_id: int, dados: AtribuicaoCreate, db: Session = Depends(get_db)):
    return AtribuicaoService(db).atribuir(turma_id, dados)


@router.delete(
    "/{turma_id}/atribuicoes/{atribuicao_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(apenas_admin)],
)
def remover_atribuicao(turma_id: int, atribuicao_id: int, db: Session = Depends(get_db)):
    AtribuicaoService(db).remover(turma_id, atribuicao_id)
