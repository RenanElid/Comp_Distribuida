import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.eventos import publicar_evento
from app.models import TokenRecuperacao, Usuario
from app.notificacoes import enviar_email
from app.repositories.token_recuperacao_repository import TokenRecuperacaoRepository
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.auth import LoginRequest, RedefinirSenhaRequest, TokenResponse
from app.security import criar_token, gerar_hash_senha, ler_token, verificar_senha

HORAS_VALIDADE_RECUPERACAO = 1
HORAS_VALIDADE_VERIFICACAO = 24


class AuthService:
    def __init__(self, db: Session):
        self.usuario_repository = UsuarioRepository(db)
        self.token_repository = TokenRecuperacaoRepository(db)

    # Confere email e senha e devolve o JWT de acesso com o id e o perfil do usuário.
    def login(self, dados: LoginRequest) -> TokenResponse:
        usuario = self.usuario_repository.buscar_por_email(dados.email.strip().lower())
        if usuario is None or not verificar_senha(dados.senha, usuario.senha_hash):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email ou senha incorretos")
        if not usuario.ativo:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Conta desativada")

        token = criar_token(
            {"sub": str(usuario.id), "email": usuario.email, "perfil": usuario.perfil, "tipo": "acesso"},
            settings.jwt_expiracao_minutos,
        )
        publicar_evento("user.logged", {"usuario_id": usuario.id, "perfil": usuario.perfil})
        return TokenResponse(access_token=token)

    def buscar_usuario_logado(self, usuario_id: int) -> Usuario:
        usuario = self.usuario_repository.buscar_por_id(usuario_id)
        if usuario is None or not usuario.ativo:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuário não encontrado ou desativado")
        return usuario

    def solicitar_recuperacao_senha(self, email: str):
        usuario = self.usuario_repository.buscar_por_email(email.strip().lower())
        if usuario is None or not usuario.ativo:
            return

        token = TokenRecuperacao(
            usuario_id=usuario.id,
            token=secrets.token_urlsafe(32),
            expira_em=datetime.now(timezone.utc) + timedelta(hours=HORAS_VALIDADE_RECUPERACAO),
        )
        self.token_repository.salvar(token)
        link = f"{settings.frontend_url}/redefinir-senha?token={token.token}"
        enviar_email(usuario.email, "Recuperação de senha", f"Acesse o link para criar uma nova senha: {link}")

    def redefinir_senha(self, dados: RedefinirSenhaRequest):
        token = self.token_repository.buscar_por_token(dados.token)
        if token is None or token.usado or token.expira_em < datetime.now(timezone.utc):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Token inválido ou expirado")

        usuario = self.usuario_repository.buscar_por_id(token.usuario_id)
        usuario.senha_hash = gerar_hash_senha(dados.nova_senha)
        token.usado = True
        # O mesmo commit grava a nova senha e marca o token como usado.
        self.usuario_repository.salvar(usuario)

    def enviar_verificacao_email(self, usuario_id: int):
        usuario = self.buscar_usuario_logado(usuario_id)
        if usuario.email_verificado:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email já verificado")

        token = criar_token(
            {"sub": str(usuario.id), "tipo": "verificacao_email"},
            HORAS_VALIDADE_VERIFICACAO * 60,
        )
        link = f"{settings.frontend_url}/verificar-email?token={token}"
        enviar_email(usuario.email, "Verificação de email", f"Acesse o link para confirmar seu email: {link}")

    def verificar_email(self, token: str):
        payload = ler_token(token)
        if payload.get("tipo") != "verificacao_email":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Token inválido ou expirado")

        usuario = self.usuario_repository.buscar_por_id(int(payload["sub"]))
        if usuario is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Token inválido ou expirado")
        usuario.email_verificado = True
        self.usuario_repository.salvar(usuario)
