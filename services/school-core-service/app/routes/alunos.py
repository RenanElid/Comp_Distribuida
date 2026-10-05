from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.aluno import AlunoCreate, AlunoPagina, AlunoResponse, AlunoUpdate
from app.security import admin_ou_professor, apenas_admin
from app.services.aluno_service import AlunoService

router = APIRouter(prefix="/alunos", tags=["Alunos"])


@router.get("", response_model=AlunoPagina, dependencies=[Depends(admin_ou_professor)])
def listar_alunos(
    matricula: str | None = None,
    nome: str | None = None,
    turma_id: int | None = None,
    pagina: int = Query(default=1, ge=1),
    tamanho: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return AlunoService(db).listar(matricula, nome, turma_id, pagina, tamanho)


@router.get("/{aluno_id}", response_model=AlunoResponse, dependencies=[Depends(admin_ou_professor)])
def buscar_aluno(aluno_id: int, db: Session = Depends(get_db)):
    return AlunoService(db).buscar(aluno_id)


@router.post("", response_model=AlunoResponse, status_code=status.HTTP_201_CREATED)
def criar_aluno(dados: AlunoCreate, usuario: dict = Depends(apenas_admin), db: Session = Depends(get_db)):
    return AlunoService(db).criar(dados, usuario["token"])


@router.put("/{aluno_id}", response_model=AlunoResponse, dependencies=[Depends(apenas_admin)])
def atualizar_aluno(aluno_id: int, dados: AlunoUpdate, db: Session = Depends(get_db)):
    return AlunoService(db).atualizar(aluno_id, dados)


@router.delete("/{aluno_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_aluno(aluno_id: int, usuario: dict = Depends(apenas_admin), db: Session = Depends(get_db)):
    AlunoService(db).excluir(aluno_id, usuario["token"])
