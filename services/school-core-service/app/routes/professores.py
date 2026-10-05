from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.professor import ProfessorCreate, ProfessorResponse, ProfessorUpdate
from app.schemas.turma import AtribuicaoResponse
from app.security import apenas_admin, usuario_logado
from app.services.professor_service import ProfessorService

router = APIRouter(prefix="/professores", tags=["Professores"])


@router.get("", response_model=list[ProfessorResponse], dependencies=[Depends(usuario_logado)])
def listar_professores(db: Session = Depends(get_db)):
    return ProfessorService(db).listar()


@router.get("/{professor_id}", response_model=ProfessorResponse, dependencies=[Depends(usuario_logado)])
def buscar_professor(professor_id: int, db: Session = Depends(get_db)):
    return ProfessorService(db).buscar(professor_id)


@router.get(
    "/{professor_id}/atribuicoes", response_model=list[AtribuicaoResponse], dependencies=[Depends(usuario_logado)]
)
def listar_atribuicoes_do_professor(professor_id: int, db: Session = Depends(get_db)):
    return ProfessorService(db).listar_atribuicoes(professor_id)


@router.post("", response_model=ProfessorResponse, status_code=status.HTTP_201_CREATED)
def criar_professor(dados: ProfessorCreate, usuario: dict = Depends(apenas_admin), db: Session = Depends(get_db)):
    return ProfessorService(db).criar(dados, usuario["token"])


@router.put("/{professor_id}", response_model=ProfessorResponse, dependencies=[Depends(apenas_admin)])
def atualizar_professor(professor_id: int, dados: ProfessorUpdate, db: Session = Depends(get_db)):
    return ProfessorService(db).atualizar(professor_id, dados)


@router.delete("/{professor_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_professor(professor_id: int, usuario: dict = Depends(apenas_admin), db: Session = Depends(get_db)):
    ProfessorService(db).excluir(professor_id, usuario["token"])
