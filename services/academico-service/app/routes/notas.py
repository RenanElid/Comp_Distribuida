from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.nota import NotaCreate, NotaResponse, NotasDaMatricula
from app.security import admin_ou_professor
from app.services.nota_service import NotaService

router = APIRouter(prefix="/notas", tags=["Notas"])

@router.get("", response_model=NotasDaMatricula, dependencies=[Depends(admin_ou_professor)])
def listar_notas(matricula_id: int, disciplina_id: int | None = None, db: Session = Depends(get_db)):
    return NotaService(db).listar_da_matricula(matricula_id, disciplina_id)

@router.post("", response_model=NotaResponse, status_code=status.HTTP_201_CREATED)
def lancar_nota(dados: NotaCreate, usuario: dict = Depends(admin_ou_professor), db: Session = Depends(get_db)):
    return NotaService(db).lancar(dados, usuario["token"])
