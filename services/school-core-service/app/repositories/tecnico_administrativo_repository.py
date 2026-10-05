from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import TecnicoAdministrativo


class TecnicoAdministrativoRepository:
    def __init__(self, db: Session):
        self.db = db

    def buscar_por_id(self, tecnico_id: int) -> TecnicoAdministrativo | None:
        return self.db.get(TecnicoAdministrativo, tecnico_id)

    def listar(self) -> list[TecnicoAdministrativo]:
        return list(self.db.scalars(select(TecnicoAdministrativo).order_by(TecnicoAdministrativo.nome)).all())

    def salvar(self, tecnico: TecnicoAdministrativo) -> TecnicoAdministrativo:
        self.db.add(tecnico)
        self.db.commit()
        self.db.refresh(tecnico)
        return tecnico

    def excluir(self, tecnico: TecnicoAdministrativo):
        self.db.delete(tecnico)
        self.db.commit()
