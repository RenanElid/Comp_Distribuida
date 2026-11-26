from datetime import date

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.frequencia import (
    ChamadaCreate,
    ChamadaResponse,
    FrequenciaCreate,
    FrequenciaResponse,
    ResumoFrequencia,
)
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

@router.get("/chamada", response_model=list[FrequenciaResponse], dependencies=[Depends(admin_ou_professor)])
def listar_chamada(turma_id: int, data: date, db: Session = Depends(get_db)):
    return FrequenciaService(db).listar_chamada(turma_id, data)

@router.post("/chamada", response_model=ChamadaResponse)
def registrar_chamada(dados: ChamadaCreate, usuario: dict = Depends(admin_ou_professor), db: Session = Depends(get_db)):
    return FrequenciaService(db).registrar_chamada(dados, usuario["token"])

@router.get("/resumo", response_model=list[ResumoFrequencia], dependencies=[Depends(admin_ou_professor)])
def resumo_da_turma(turma_id: int, db: Session = Depends(get_db)):
    return FrequenciaService(db).resumo_da_turma(turma_id)
