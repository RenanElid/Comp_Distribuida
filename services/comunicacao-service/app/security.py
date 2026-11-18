import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

bearer = HTTPBearer()

def usuario_logado(credenciais: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        payload = jwt.decode(credenciais.credentials, settings.jwt_secret, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido ou expirado")

    if payload.get("tipo") != "acesso":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido ou expirado")
    payload["token"] = credenciais.credentials
    return payload
