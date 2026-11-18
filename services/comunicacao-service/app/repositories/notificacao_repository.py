from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import EventoProcessado, Notificacao

class NotificacaoRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar_do_usuario(self, usuario_id: int) -> list[Notificacao]:
        consulta = select(Notificacao).where(Notificacao.usuario_id == usuario_id).order_by(Notificacao.criada_em.desc())
        return list(self.db.scalars(consulta).all())

    def buscar_por_id(self, notificacao_id: int) -> Notificacao | None:
        return self.db.get(Notificacao, notificacao_id)

    def salvar(self, notificacao: Notificacao) -> Notificacao:
        self.db.add(notificacao)
        self.db.commit()
        self.db.refresh(notificacao)
        return notificacao

    def evento_ja_processado(self, evento_id: str) -> bool:
        return self.db.get(EventoProcessado, evento_id) is not None

    def salvar_evento(self, evento_id: str, topico: str, notificacao: Notificacao | None):
        self.db.add(EventoProcessado(evento_id=evento_id, topico=topico))
        if notificacao is not None:
            self.db.add(notificacao)
        self.db.commit()
