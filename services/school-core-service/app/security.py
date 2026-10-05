import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

bearer = HTTPBearer()


# Valida o JWT emitido pelo user-service usando a mesma chave (JWT_SECRET).
# O token original fica guardado em "token" para ser repassado ao user-service.
def usuario_logado(credenciais: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        payload = jwt.decode(credenciais.credentials, settings.jwt_secret, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido ou expirado")

    if payload.get("tipo") != "acesso":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido ou expirado")
    payload["token"] = credenciais.credentials
    return payload


def apenas_admin(usuario: dict = Depends(usuario_logado)) -> dict:
    if usuario["perfil"] != "ADMIN":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acesso permitido apenas para ADMIN")
    return usuario


def admin_ou_professor(usuario: dict = Depends(usuario_logado)) -> dict:
    if usuario["perfil"] not in ("ADMIN", "TEACHER"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acesso permitido apenas para ADMIN ou TEACHER")
    return usuario
