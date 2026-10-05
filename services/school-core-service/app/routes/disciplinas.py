from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.disciplina import DisciplinaCreate, DisciplinaResponse, DisciplinaUpdate
from app.security import apenas_admin, usuario_logado
from app.services.disciplina_service import DisciplinaService

router = APIRouter(prefix="/disciplinas", tags=["Disciplinas"])


@router.get("", response_model=list[DisciplinaResponse], dependencies=[Depends(usuario_logado)])
def listar_disciplinas(db: Session = Depends(get_db)):
    return DisciplinaService(db).listar()


@router.get("/{disciplina_id}", response_model=DisciplinaResponse, dependencies=[Depends(usuario_logado)])
def buscar_disciplina(disciplina_id: int, db: Session = Depends(get_db)):
    return DisciplinaService(db).buscar(disciplina_id)


@router.post(
    "", response_model=DisciplinaResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(apenas_admin)]
)
def criar_disciplina(dados: DisciplinaCreate, db: Session = Depends(get_db)):
    return DisciplinaService(db).criar(dados)


@router.put("/{disciplina_id}", response_model=DisciplinaResponse, dependencies=[Depends(apenas_admin)])
def atualizar_disciplina(disciplina_id: int, dados: DisciplinaUpdate, db: Session = Depends(get_db)):
    return DisciplinaService(db).atualizar(disciplina_id, dados)


@router.delete("/{disciplina_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(apenas_admin)])
def excluir_disciplina(disciplina_id: int, db: Session = Depends(get_db)):
    DisciplinaService(db).excluir(disciplina_id)
