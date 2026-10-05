from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Usuario
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.usuario import UsuarioCreate, UsuarioPagina, UsuarioUpdate
from app.security import gerar_hash_senha


class UsuarioService:
    def __init__(self, db: Session):
        self.usuario_repository = UsuarioRepository(db)

    def listar(self, perfil: str | None, pagina: int, tamanho: int) -> UsuarioPagina:
        usuarios, total = self.usuario_repository.listar(perfil, pagina, tamanho)
        return UsuarioPagina(itens=usuarios, total=total, pagina=pagina, tamanho=tamanho)

    def buscar(self, usuario_id: int) -> Usuario:
        usuario = self.usuario_repository.buscar_por_id(usuario_id)
        if usuario is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuário não encontrado")
        return usuario

    def criar(self, dados: UsuarioCreate) -> Usuario:
        email = dados.email.strip().lower()
        if self.usuario_repository.buscar_por_email(email):
            raise HTTPException(status.HTTP_409_CONFLICT, "Email já cadastrado")

        usuario = Usuario(
            email=email,
            senha_hash=gerar_hash_senha(dados.senha),
            perfil=dados.perfil,
            email_verificado=False,
            ativo=True,
        )
        return self.usuario_repository.salvar(usuario)

    def atualizar(self, usuario_id: int, dados: UsuarioUpdate) -> Usuario:
        usuario = self.buscar(usuario_id)

        if dados.email is not None:
            email = dados.email.strip().lower()
            outro_usuario = self.usuario_repository.buscar_por_email(email)
            if outro_usuario and outro_usuario.id != usuario.id:
                raise HTTPException(status.HTTP_409_CONFLICT, "Email já cadastrado")
            if email != usuario.email:
                usuario.email = email
                usuario.email_verificado = False

        if dados.perfil is not None:
            usuario.perfil = dados.perfil
        if dados.ativo is not None:
            usuario.ativo = dados.ativo

        return self.usuario_repository.salvar(usuario)

    def desativar(self, usuario_id: int):
        usuario = self.buscar(usuario_id)
        usuario.ativo = False
        self.usuario_repository.salvar(usuario)
