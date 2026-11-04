from decimal import Decimal
from sqlalchemy import BigInteger, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Nota(Base):
    __tablename__ = "notas"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    matricula_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("matriculas.id"))
    descricao: Mapped[str] = mapped_column(String(50))
    valor: Mapped[Decimal] = mapped_column(Numeric(4, 2))
