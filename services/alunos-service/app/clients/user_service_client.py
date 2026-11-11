import logging

import httpx
from fastapi import HTTPException, status

from app.clients.circuit_breaker import CircuitBreaker
from app.config import settings

logger = logging.getLogger("user_service_client")

TIMEOUT_SEGUNDOS = 5

circuito_usuarios = CircuitBreaker("user-service")

def criar_usuario(email: str, senha: str, perfil: str, token: str) -> int:
    if circuito_usuarios.esta_aberto():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de usuários indisponível")

    try:
        resposta = httpx.post(
            f"{settings.user_service_url}/usuarios",
            json={"email": email, "senha": senha, "perfil": perfil},
            headers={"Authorization": f"Bearer {token}"},
            timeout=TIMEOUT_SEGUNDOS,
        )
    except httpx.HTTPError as erro:
        logger.warning("Falha ao chamar o user-service: %s", erro)
        circuito_usuarios.registrar_falha()
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de usuários indisponível")

    if resposta.status_code >= 500:
        logger.warning("O user-service respondeu %s", resposta.status_code)
        circuito_usuarios.registrar_falha()
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de usuários indisponível")

    circuito_usuarios.registrar_sucesso()
    if resposta.status_code == 409:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email já cadastrado")
    if resposta.status_code == 422:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, resposta.json()["detail"])
    if resposta.status_code != 201:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Erro ao criar usuário no serviço de usuários")
    return resposta.json()["id"]

def desativar_usuario(usuario_id: int, token: str):
    if circuito_usuarios.esta_aberto():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de usuários indisponível")

    try:
        resposta = httpx.delete(
            f"{settings.user_service_url}/usuarios/{usuario_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=TIMEOUT_SEGUNDOS,
        )
    except httpx.HTTPError as erro:
        logger.warning("Falha ao chamar o user-service: %s", erro)
        circuito_usuarios.registrar_falha()
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de usuários indisponível")

    if resposta.status_code >= 500:
        logger.warning("O user-service respondeu %s", resposta.status_code)
        circuito_usuarios.registrar_falha()
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de usuários indisponível")

    circuito_usuarios.registrar_sucesso()
    if resposta.status_code not in (204, 404):
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Erro ao desativar usuário no serviço de usuários")
