from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.tecnico_administrativo import TecnicoCreate, TecnicoResponse, TecnicoUpdate
from app.security import apenas_admin
from app.services.tecnico_administrativo_service import TecnicoAdministrativoService

router = APIRouter(prefix="/tecnicos", tags=["Técnicos administrativos"])


@router.get("", response_model=list[TecnicoResponse], dependencies=[Depends(apenas_admin)])
def listar_tecnicos(db: Session = Depends(get_db)):
    return TecnicoAdministrativoService(db).listar()


@router.get("/{tecnico_id}", response_model=TecnicoResponse, dependencies=[Depends(apenas_admin)])
def buscar_tecnico(tecnico_id: int, db: Session = Depends(get_db)):
    return TecnicoAdministrativoService(db).buscar(tecnico_id)


@router.post("", response_model=TecnicoResponse, status_code=status.HTTP_201_CREATED)
def criar_tecnico(dados: TecnicoCreate, usuario: dict = Depends(apenas_admin), db: Session = Depends(get_db)):
    return TecnicoAdministrativoService(db).criar(dados, usuario["token"])


@router.put("/{tecnico_id}", response_model=TecnicoResponse, dependencies=[Depends(apenas_admin)])
def atualizar_tecnico(tecnico_id: int, dados: TecnicoUpdate, db: Session = Depends(get_db)):
    return TecnicoAdministrativoService(db).atualizar(tecnico_id, dados)


@router.delete("/{tecnico_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_tecnico(tecnico_id: int, usuario: dict = Depends(apenas_admin), db: Session = Depends(get_db)):
    TecnicoAdministrativoService(db).excluir(tecnico_id, usuario["token"])
