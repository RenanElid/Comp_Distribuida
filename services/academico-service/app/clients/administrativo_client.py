import logging
import httpx
from fastapi import HTTPException, status
from app.config import settings

logger = logging.getLogger("administrativo_client")

TIMEOUT_SEGUNDOS = 3
def verificar_turma(turma_id: int, token: str):
    try:
        resposta = httpx.get(
            f"{settings.administrativo_service_url}/turmas/{turma_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=TIMEOUT_SEGUNDOS,
        )
    except httpx.HTTPError as erro:
        logger.warning("Falha ao chamar o administrativo-service: %s", erro)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço administrativo indisponível")

    if resposta.status_code == 404:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Turma não encontrada")
    if resposta.status_code >= 500:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço administrativo indisponível")
    if resposta.status_code != 200:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Erro ao consultar o serviço administrativo")
