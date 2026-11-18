import logging
import time

import httpx
from fastapi import HTTPException, status

from app.clients.circuit_breaker import CircuitBreaker
from app.config import settings

logger = logging.getLogger("administrativo_client")

TIMEOUT_SEGUNDOS = 3
TOTAL_DE_TENTATIVAS = 3

circuito_administrativo = CircuitBreaker("administrativo-service")

def buscar_turma(turma_id: int, token: str) -> dict:
    if circuito_administrativo.esta_aberto():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço administrativo indisponível")

    for tentativa in range(1, TOTAL_DE_TENTATIVAS + 1):
        try:
            resposta = httpx.get(
                f"{settings.administrativo_service_url}/turmas/{turma_id}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=TIMEOUT_SEGUNDOS,
            )
        except httpx.HTTPError as erro:
            logger.warning("Tentativa %s de %s ao administrativo-service falhou: %s", tentativa, TOTAL_DE_TENTATIVAS, erro)
        else:
            if resposta.status_code < 500:
                circuito_administrativo.registrar_sucesso()
                if resposta.status_code == 404:
                    raise HTTPException(status.HTTP_404_NOT_FOUND, "Turma não encontrada")
                if resposta.status_code != 200:
                    raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Erro ao consultar o serviço administrativo")
                return resposta.json()
            logger.warning(
                "Tentativa %s de %s ao administrativo-service falhou: resposta %s",
                tentativa,
                TOTAL_DE_TENTATIVAS,
                resposta.status_code,
            )

        if tentativa < TOTAL_DE_TENTATIVAS:
            time.sleep(settings.espera_entre_tentativas)

    circuito_administrativo.registrar_falha()
    raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço administrativo indisponível")
