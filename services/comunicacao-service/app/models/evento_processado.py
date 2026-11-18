from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

class EventoProcessado(Base):
    __tablename__ = "eventos_processados"

    evento_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    topico: Mapped[str] = mapped_column(String(100))
    processado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
