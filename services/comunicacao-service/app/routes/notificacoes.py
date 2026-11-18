from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.notificacao import NotificacaoResponse
from app.security import usuario_logado
from app.services.notificacao_service import NotificacaoService

router = APIRouter(prefix="/notificacoes", tags=["Notificações"])

@router.get("", response_model=list[NotificacaoResponse])
def listar_notificacoes(usuario: dict = Depends(usuario_logado), db: Session = Depends(get_db)):
    return NotificacaoService(db).listar_do_usuario(int(usuario["sub"]))

@router.patch("/{notificacao_id}/lida", response_model=NotificacaoResponse)
def marcar_como_lida(notificacao_id: int, usuario: dict = Depends(usuario_logado), db: Session = Depends(get_db)):
    return NotificacaoService(db).marcar_como_lida(notificacao_id, int(usuario["sub"]))
