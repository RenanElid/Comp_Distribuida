from sqlalchemy import BigInteger, Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.disciplina import Disciplina

professor_disciplinas = Table(
    "professor_disciplinas",
    Base.metadata,
    Column("professor_id", BigInteger, ForeignKey("professores.id", ondelete="CASCADE"), primary_key=True),
    Column("disciplina_id", BigInteger, ForeignKey("disciplinas.id", ondelete="CASCADE"), primary_key=True),
)

class Professor(Base):
    __tablename__ = "professores"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(BigInteger, unique=True)
    nome: Mapped[str] = mapped_column(String(150))
    qualificacao: Mapped[str | None] = mapped_column(String(255))
    contato: Mapped[str | None] = mapped_column(String(100))
    disciplinas: Mapped[list[Disciplina]] = relationship(
        secondary=professor_disciplinas, lazy="selectin", order_by=Disciplina.nome
    )

    @property
    def disciplina_ids(self) -> list[int]:
        return [disciplina.id for disciplina in self.disciplinas]
