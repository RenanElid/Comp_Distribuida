import logging
import httpx
from fastapi import HTTPException, status
from app.config import settings

logger = logging.getLogger("alunos_client")
TIMEOUT_SEGUNDOS = 3

def verificar_aluno(aluno_id: int, token: str):
    try:
        resposta = httpx.get(
            f"{settings.alunos_service_url}/alunos/{aluno_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=TIMEOUT_SEGUNDOS,
        )
    except httpx.HTTPError as erro:
        logger.warning("Falha ao chamar o alunos-service: %s", erro)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de alunos indisponível")

    if resposta.status_code == 404:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Aluno não encontrado")
    if resposta.status_code >= 500:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de alunos indisponível")
    if resposta.status_code != 200:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Erro ao consultar o serviço de alunos")
