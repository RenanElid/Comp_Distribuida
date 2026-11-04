from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.matricula import MatriculaCreate, MatriculaResponse
from app.security import admin_ou_professor
from app.services.matricula_service import MatriculaService

router = APIRouter(prefix="/matriculas", tags=["Matrículas"])

@router.get("", response_model=list[MatriculaResponse], dependencies=[Depends(admin_ou_professor)])
def listar_matriculas(aluno_id: int | None = None, turma_id: int | None = None, db: Session = Depends(get_db)):
    return MatriculaService(db).listar(aluno_id, turma_id)

@router.post("", response_model=MatriculaResponse, status_code=status.HTTP_201_CREATED)
def matricular_aluno(
    dados: MatriculaCreate, usuario: dict = Depends(admin_ou_professor), db: Session = Depends(get_db)
):
    return MatriculaService(db).matricular(dados, usuario["token"])

@router.delete("/{matricula_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(admin_ou_professor)])
def cancelar_matricula(matricula_id: int, db: Session = Depends(get_db)):
    MatriculaService(db).cancelar(matricula_id)
