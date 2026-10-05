from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.clients import user_service_client
from app.models import TecnicoAdministrativo
from app.repositories.tecnico_administrativo_repository import TecnicoAdministrativoRepository
from app.schemas.tecnico_administrativo import TecnicoCreate, TecnicoUpdate


class TecnicoAdministrativoService:
    def __init__(self, db: Session):
        self.tecnico_repository = TecnicoAdministrativoRepository(db)

    def listar(self) -> list[TecnicoAdministrativo]:
        return self.tecnico_repository.listar()

    def buscar(self, tecnico_id: int) -> TecnicoAdministrativo:
        tecnico = self.tecnico_repository.buscar_por_id(tecnico_id)
        if tecnico is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Técnico administrativo não encontrado")
        return tecnico

    def criar(self, dados: TecnicoCreate, token: str) -> TecnicoAdministrativo:
        usuario_id = user_service_client.criar_usuario(dados.email, dados.senha, "ADMIN", token)
        tecnico = TecnicoAdministrativo(
            usuario_id=usuario_id,
            nome=dados.nome,
            cargo=dados.cargo,
            contato=dados.contato,
        )
        return self.tecnico_repository.salvar(tecnico)

    def atualizar(self, tecnico_id: int, dados: TecnicoUpdate) -> TecnicoAdministrativo:
        tecnico = self.buscar(tecnico_id)
        for campo, valor in dados.model_dump(exclude_none=True).items():
            setattr(tecnico, campo, valor)
        return self.tecnico_repository.salvar(tecnico)

    def excluir(self, tecnico_id: int, token: str):
        tecnico = self.buscar(tecnico_id)
        user_service_client.desativar_usuario(tecnico.usuario_id, token)
        self.tecnico_repository.excluir(tecnico)
