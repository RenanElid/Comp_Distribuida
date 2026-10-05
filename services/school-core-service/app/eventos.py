import logging

logger = logging.getLogger("eventos")


# Ponto único de publicação de eventos. Por enquanto só registra no log;
# quando o Kafka estiver no ar, a publicação no tópico entra aqui.
def publicar_evento(topico: str, dados: dict):
    logger.info("Evento %s: %s", topico, dados)
