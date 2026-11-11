import logging
import time

logger = logging.getLogger("circuit_breaker")

class CircuitBreaker:
    def __init__(self, nome_do_servico: str, limite_de_falhas: int = 5, segundos_aberto: int = 30):
        self.nome_do_servico = nome_do_servico
        self.limite_de_falhas = limite_de_falhas
        self.segundos_aberto = segundos_aberto
        self.falhas_seguidas = 0
        self.aberto_desde = None

    def esta_aberto(self) -> bool:
        if self.aberto_desde is None:
            return False
        return time.monotonic() - self.aberto_desde < self.segundos_aberto

    def registrar_falha(self):
        self.falhas_seguidas += 1
        if self.falhas_seguidas >= self.limite_de_falhas:
            self.aberto_desde = time.monotonic()
            logger.warning(
                "Circuito do %s aberto por %s segundos (%s falhas seguidas)",
                self.nome_do_servico,
                self.segundos_aberto,
                self.falhas_seguidas,
            )

    def registrar_sucesso(self):
        if self.aberto_desde is not None:
            logger.info("Circuito do %s fechado", self.nome_do_servico)
        self.falhas_seguidas = 0
        self.aberto_desde = None
