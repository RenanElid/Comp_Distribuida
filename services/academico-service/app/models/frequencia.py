from datetime import date
from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Frequencia(Base):
    __tablename__ = "frequencias"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    matricula_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("matriculas.id"))
    data: Mapped[date]
    situacao: Mapped[str] = mapped_column(String(10))
