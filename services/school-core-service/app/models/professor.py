from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Professor(Base):
    __tablename__ = "professores"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(BigInteger, unique=True)
    nome: Mapped[str] = mapped_column(String(150))
    qualificacao: Mapped[str | None] = mapped_column(String(255))
    contato: Mapped[str | None] = mapped_column(String(100))
