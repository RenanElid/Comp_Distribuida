from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.usuario import Perfil, UsuarioCreate, UsuarioPagina, UsuarioResponse, UsuarioUpdate
from app.security import apenas_admin
from app.services.usuario_service import UsuarioService

router = APIRouter(prefix="/usuarios", tags=["Usuários"], dependencies=[Depends(apenas_admin)])


@router.get("", response_model=UsuarioPagina)
def listar_usuarios(
    perfil: Perfil | None = None,
    pagina: int = Query(default=1, ge=1),
    tamanho: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return UsuarioService(db).listar(perfil, pagina, tamanho)


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def buscar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    return UsuarioService(db).buscar(usuario_id)


@router.post("", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def criar_usuario(dados: UsuarioCreate, db: Session = Depends(get_db)):
    return UsuarioService(db).criar(dados)


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def atualizar_usuario(usuario_id: int, dados: UsuarioUpdate, db: Session = Depends(get_db)):
    return UsuarioService(db).atualizar(usuario_id, dados)


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def desativar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    UsuarioService(db).desativar(usuario_id)
