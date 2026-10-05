from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Usuario


class UsuarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def buscar_por_id(self, usuario_id: int) -> Usuario | None:
        return self.db.get(Usuario, usuario_id)

    def buscar_por_email(self, email: str) -> Usuario | None:
        return self.db.scalar(select(Usuario).where(Usuario.email == email))

    def listar(self, perfil: str | None, pagina: int, tamanho: int) -> tuple[list[Usuario], int]:
        consulta = select(Usuario)
        if perfil:
            consulta = consulta.where(Usuario.perfil == perfil)

        total = self.db.scalar(select(func.count()).select_from(consulta.subquery()))
        usuarios = self.db.scalars(
            consulta.order_by(Usuario.id).offset((pagina - 1) * tamanho).limit(tamanho)
        ).all()
        return list(usuarios), total

    def salvar(self, usuario: Usuario) -> Usuario:
        self.db.add(usuario)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario
