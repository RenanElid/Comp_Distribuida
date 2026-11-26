import logging
import smtplib
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger("notificacoes")

def enviar_email(destinatario: str, assunto: str, mensagem: str):
    if not settings.smtp_host:
        logger.info("Email para %s | %s | %s", destinatario, assunto, mensagem)
        return

    email = EmailMessage()
    email["From"] = settings.smtp_remetente
    email["To"] = destinatario
    email["Subject"] = f"DistriSchool - {assunto}"
    email.set_content(mensagem)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_porta, timeout=5) as servidor:
            servidor.send_message(email)
        logger.info("Email \"%s\" enviado para %s", assunto, destinatario)
    except (OSError, smtplib.SMTPException) as erro:
        logger.warning("Não foi possível enviar o email \"%s\" para %s: %s", assunto, destinatario, erro)
