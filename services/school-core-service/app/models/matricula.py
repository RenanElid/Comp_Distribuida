from sqlalchemy import BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Matricula(Base):
    __tablename__ = "matriculas"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    aluno_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("alunos.id"))
    turma_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("turmas.id"))
