from sqlalchemy import BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Atribuicao(Base):
    __tablename__ = "atribuicoes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    turma_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("turmas.id"))
    disciplina_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("disciplinas.id"))
    professor_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("professores.id"))
