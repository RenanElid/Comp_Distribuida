from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import TokenRecuperacao


class TokenRecuperacaoRepository:
    def __init__(self, db: Session):
        self.db = db

    def buscar_por_token(self, token: str) -> TokenRecuperacao | None:
        return self.db.scalar(select(TokenRecuperacao).where(TokenRecuperacao.token == token))

    def salvar(self, token: TokenRecuperacao) -> TokenRecuperacao:
        self.db.add(token)
        self.db.commit()
        self.db.refresh(token)
        return token
