import json
import logging
from threading import Event

from confluent_kafka import Consumer

from app.config import settings
from app.database import SessionLocal
from app.repositories.matricula_repository import MatriculaRepository

logger = logging.getLogger("consumidor")

TOPICOS = ["student.deleted", "class.deleted"]
parar_consumidor = Event()

def tratar_evento(tipo: str, dados: dict):
    logger.info("Evento %s recebido: %s", tipo, dados)

    with SessionLocal() as db:
        matricula_repository = MatriculaRepository(db)
        if tipo == "student.deleted":
            apagadas = matricula_repository.excluir_do_aluno(dados["aluno_id"])
        elif tipo == "class.deleted":
            apagadas = matricula_repository.excluir_da_turma(dados["turma_id"])
        else:
            logger.info("Evento %s ignorado: o acadêmico não trata esse tipo", tipo)
            return

    logger.info("Evento %s: %s matrícula(s) apagada(s)", tipo, apagadas)

def rodar_consumidor():
    consumer = Consumer(
        {
            "bootstrap.servers": settings.kafka_bootstrap_servers,
            "group.id": "academico-service",
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
                tratar_evento(evento["tipo"], evento["dados"])
            except Exception:
                logger.exception("Falha ao processar mensagem do tópico %s", mensagem.topic())
    finally:
        consumer.close()
        logger.info("Consumidor desligado")
