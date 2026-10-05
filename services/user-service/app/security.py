from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

bearer = HTTPBearer()


def gerar_hash_senha(senha: str) -> str:
    return bcrypt.hashpw(senha.encode(), bcrypt.gensalt(rounds=10)).decode()


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return bcrypt.checkpw(senha.encode(), senha_hash.encode())


def criar_token(dados: dict, minutos: int) -> str:
    expiracao = datetime.now(timezone.utc) + timedelta(minutes=minutos)
    return jwt.encode({**dados, "exp": expiracao}, settings.jwt_secret, algorithm="HS256")


def ler_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido ou expirado")


# Lê o JWT do header Authorization e devolve os dados do usuário que estão no token.
def usuario_logado(credenciais: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    payload = ler_token(credenciais.credentials)
    if payload.get("tipo") != "acesso":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido ou expirado")
    return payload


def apenas_admin(usuario: dict = Depends(usuario_logado)) -> dict:
    if usuario["perfil"] != "ADMIN":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acesso permitido apenas para ADMIN")
    return usuario
