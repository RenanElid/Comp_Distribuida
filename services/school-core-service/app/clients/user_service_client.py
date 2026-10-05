import httpx
from fastapi import HTTPException, status

from app.config import settings

TIMEOUT_SEGUNDOS = 5


# Cria o usuário (login) no user-service e devolve o id dele.
# O token de quem fez a requisição é repassado, então só ADMIN consegue criar.
def criar_usuario(email: str, senha: str, perfil: str, token: str) -> int:
    try:
        resposta = httpx.post(
            f"{settings.user_service_url}/usuarios",
            json={"email": email, "senha": senha, "perfil": perfil},
            headers={"Authorization": f"Bearer {token}"},
            timeout=TIMEOUT_SEGUNDOS,
        )
    except httpx.HTTPError:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de usuários indisponível")

    if resposta.status_code == 409:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email já cadastrado")
    if resposta.status_code == 422:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, resposta.json()["detail"])
    if resposta.status_code != 201:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Erro ao criar usuário no serviço de usuários")
    return resposta.json()["id"]


def desativar_usuario(usuario_id: int, token: str):
    try:
        resposta = httpx.delete(
            f"{settings.user_service_url}/usuarios/{usuario_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=TIMEOUT_SEGUNDOS,
        )
    except httpx.HTTPError:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de usuários indisponível")

    if resposta.status_code not in (204, 404):
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Erro ao desativar usuário no serviço de usuários")
