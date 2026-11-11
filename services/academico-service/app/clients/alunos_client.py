import logging
import time

import httpx
from fastapi import HTTPException, status

from app.clients.circuit_breaker import CircuitBreaker
from app.config import settings

logger = logging.getLogger("alunos_client")

TIMEOUT_SEGUNDOS = 3
TOTAL_DE_TENTATIVAS = 3

circuito_alunos = CircuitBreaker("alunos-service")

def verificar_aluno(aluno_id: int, token: str):
    if circuito_alunos.esta_aberto():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de alunos indisponível")

    for tentativa in range(1, TOTAL_DE_TENTATIVAS + 1):
        try:
            resposta = httpx.get(
                f"{settings.alunos_service_url}/alunos/{aluno_id}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=TIMEOUT_SEGUNDOS,
            )
        except httpx.HTTPError as erro:
            logger.warning("Tentativa %s de %s ao alunos-service falhou: %s", tentativa, TOTAL_DE_TENTATIVAS, erro)
        else:
            if resposta.status_code < 500:
                circuito_alunos.registrar_sucesso()
                if resposta.status_code == 404:
                    raise HTTPException(status.HTTP_404_NOT_FOUND, "Aluno não encontrado")
                if resposta.status_code != 200:
                    raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Erro ao consultar o serviço de alunos")
                return
            logger.warning(
                "Tentativa %s de %s ao alunos-service falhou: resposta %s",
                tentativa,
                TOTAL_DE_TENTATIVAS,
                resposta.status_code,
            )

        if tentativa < TOTAL_DE_TENTATIVAS:
            time.sleep(settings.espera_entre_tentativas)

    circuito_alunos.registrar_falha()
    raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de alunos indisponível")
