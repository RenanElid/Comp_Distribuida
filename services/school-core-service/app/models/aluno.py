from datetime import date

from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Aluno(Base):
    __tablename__ = "alunos"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(BigInteger, unique=True)
    matricula: Mapped[str] = mapped_column(String(20), unique=True)
    nome: Mapped[str] = mapped_column(String(150))
    data_nascimento: Mapped[date]
    endereco: Mapped[str | None] = mapped_column(String(255))
    contato: Mapped[str | None] = mapped_column(String(100))
