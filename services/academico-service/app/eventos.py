import json
import logging
from datetime import datetime, timezone
from threading import Event, Lock, Thread

from confluent_kafka import KafkaException, Producer

from app.config import settings

logger = logging.getLogger("eventos")
_lock = Lock()
_parar = Event()
_produtor: Producer | None = None
_thread: Thread | None = None

def _registrar_entrega(erro, mensagem):
    if erro is not None:
        logger.error("Falha ao entregar evento no tópico %s: %s", mensagem.topic(), erro)
    else:
        logger.info("Evento entregue no tópico %s, offset %s", mensagem.topic(), mensagem.offset())

def _processar_entregas(produtor: Producer):
    while not _parar.is_set():
        try:
            produtor.poll(0.5)
        except KafkaException:
            logger.exception("Falha ao consultar entregas do Kafka")
            _parar.wait(1)

def _obter_produtor() -> Producer | None:
    global _produtor, _thread
    if not settings.kafka_bootstrap_servers:
        return None

    with _lock:
        if _produtor is None:
            _produtor = Producer(
                {
                    "bootstrap.servers": settings.kafka_bootstrap_servers,
                    "client.id": "distrischool-academico-service",
                    "enable.idempotence": True,
                    "acks": "all",
                    "message.timeout.ms": 10000,
                }
            )
            _parar.clear()
            _thread = Thread(target=_processar_entregas, args=(_produtor,), name="kafka-entregas", daemon=True)
            _thread.start()
        return _produtor

def publicar_evento(topico: str, dados: dict):
    produtor = _obter_produtor()
    if produtor is None:
        logger.info("Evento %s: %s (Kafka não configurado)", topico, dados)
        return

    mensagem = json.dumps(
        {"tipo": topico, "ocorrido_em": datetime.now(timezone.utc).isoformat(), "dados": dados},
        ensure_ascii=False,
    ).encode("utf-8")
    try:
        produtor.produce(topico, value=mensagem, on_delivery=_registrar_entrega)
    except (BufferError, KafkaException):
        logger.exception("Não foi possível enfileirar o evento %s no Kafka", topico)

def fechar_produtor():
    global _produtor, _thread
    with _lock:
        produtor, thread = _produtor, _thread
        _produtor = None
        _thread = None

    if produtor is None:
        return
    _parar.set()
    if thread is not None:
        thread.join(timeout=2)
    pendentes = produtor.flush(5)
    if pendentes:
        logger.error("%s evento(s) ficaram sem confirmação do Kafka", pendentes)
