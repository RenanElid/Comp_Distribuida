from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TecnicoAdministrativo(Base):
    __tablename__ = "tecnicos_administrativos"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(BigInteger, unique=True)
    nome: Mapped[str] = mapped_column(String(150))
    cargo: Mapped[str | None] = mapped_column(String(100))
    contato: Mapped[str | None] = mapped_column(String(100))
