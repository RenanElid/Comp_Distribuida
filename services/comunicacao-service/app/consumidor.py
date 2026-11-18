import json
import logging
from threading import Event

from confluent_kafka import Consumer

from app.config import settings
from app.database import SessionLocal
from app.services.notificacao_service import NotificacaoService

logger = logging.getLogger("consumidor")

TOPICOS = ["grade.recorded", "attendance.recorded", "teacher.assigned"]
parar_consumidor = Event()

def rodar_consumidor():
    consumer = Consumer(
        {
            "bootstrap.servers": settings.kafka_bootstrap_servers,
            "group.id": "comunicacao-service",
            "auto.offset.reset": "earliest",
            "allow.auto.create.topics": True,
        }
    )
    consumer.subscribe(TOPICOS)
    logger.info("Consumidor ligado nos tópicos %s", TOPICOS)

    try:
        while not parar_consumidor.is_set():
            mensagem = consumer.poll(1.0)
            if mensagem is None:
                continue
            if mensagem.error():
                logger.warning("Erro do Kafka: %s", mensagem.error())
                continue

            try:
                evento = json.loads(mensagem.value())
                with SessionLocal() as db:
                    NotificacaoService(db).processar_evento(mensagem.topic(), evento)
            except Exception:
                logger.exception("Falha ao processar mensagem do tópico %s", mensagem.topic())
    finally:
        consumer.close()
        logger.info("Consumidor desligado")
