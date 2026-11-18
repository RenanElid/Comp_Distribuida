from datetime import datetime

from sqlalchemy import BigInteger, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

class Notificacao(Base):
    __tablename__ = "notificacoes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(BigInteger)
    tipo: Mapped[str] = mapped_column(String(30))
    mensagem: Mapped[str] = mapped_column(String(255))
    lida: Mapped[bool] = mapped_column(default=False)
    criada_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
