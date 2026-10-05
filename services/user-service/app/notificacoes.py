import logging

logger = logging.getLogger("notificacoes")


# Ainda não existe serviço de email. Por enquanto a mensagem vai para o log.
def enviar_email(destinatario: str, assunto: str, mensagem: str):
    logger.info("Email para %s | %s | %s", destinatario, assunto, mensagem)
