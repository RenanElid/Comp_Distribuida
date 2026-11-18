from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.frequencia import FrequenciaCreate, FrequenciaResponse
from app.security import admin_ou_professor
from app.services.frequencia_service import FrequenciaService

router = APIRouter(prefix="/frequencias", tags=["Frequências"])

@router.get("", response_model=list[FrequenciaResponse], dependencies=[Depends(admin_ou_professor)])
def listar_frequencias(matricula_id: int, db: Session = Depends(get_db)):
    return FrequenciaService(db).listar_da_matricula(matricula_id)

@router.post("", response_model=FrequenciaResponse, status_code=status.HTTP_201_CREATED)
def registrar_frequencia(
    dados: FrequenciaCreate, usuario: dict = Depends(admin_ou_professor), db: Session = Depends(get_db)
):
    return FrequenciaService(db).registrar(dados, usuario["token"])
