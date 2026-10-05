from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import (
    LoginRequest,
    MensagemResponse,
    RecuperarSenhaRequest,
    RedefinirSenhaRequest,
    TokenResponse,
)
from app.schemas.usuario import UsuarioResponse
from app.security import usuario_logado
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login", response_model=TokenResponse)
def login(dados: LoginRequest, db: Session = Depends(get_db)):
    return AuthService(db).login(dados)


@router.get("/me", response_model=UsuarioResponse)
def buscar_meus_dados(usuario: dict = Depends(usuario_logado), db: Session = Depends(get_db)):
    return AuthService(db).buscar_usuario_logado(int(usuario["sub"]))


@router.post("/recuperar-senha", response_model=MensagemResponse)
def recuperar_senha(dados: RecuperarSenhaRequest, db: Session = Depends(get_db)):
    AuthService(db).solicitar_recuperacao_senha(dados.email)
    return MensagemResponse(mensagem="Se o email estiver cadastrado, enviaremos um link de recuperação")


@router.post("/redefinir-senha", response_model=MensagemResponse)
def redefinir_senha(dados: RedefinirSenhaRequest, db: Session = Depends(get_db)):
    AuthService(db).redefinir_senha(dados)
    return MensagemResponse(mensagem="Senha alterada com sucesso")


@router.post("/enviar-verificacao", response_model=MensagemResponse)
def enviar_verificacao(usuario: dict = Depends(usuario_logado), db: Session = Depends(get_db)):
    AuthService(db).enviar_verificacao_email(int(usuario["sub"]))
    return MensagemResponse(mensagem="Link de verificação enviado para o email")


@router.get("/verificar-email", response_model=MensagemResponse)
def verificar_email(token: str, db: Session = Depends(get_db)):
    AuthService(db).verificar_email(token)
    return MensagemResponse(mensagem="Email verificado com sucesso")
