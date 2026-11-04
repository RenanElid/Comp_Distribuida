import logging

logger = logging.getLogger("notificacoes")

def enviar_email(destinatario: str, assunto: str, mensagem: str):
    logger.info("Email para %s | %s | %s", destinatario, assunto, mensagem)
