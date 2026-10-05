from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Perfil = Literal["ADMIN", "TEACHER", "STUDENT", "PARENT"]
PADRAO_EMAIL = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class UsuarioCreate(BaseModel):
    email: str = Field(pattern=PADRAO_EMAIL, max_length=255)
    senha: str = Field(min_length=8, max_length=72)
    perfil: Perfil


class UsuarioUpdate(BaseModel):
    email: str | None = Field(default=None, pattern=PADRAO_EMAIL, max_length=255)
    perfil: Perfil | None = None
    ativo: bool | None = None


class UsuarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    perfil: Perfil
    email_verificado: bool
    ativo: bool


class UsuarioPagina(BaseModel):
    itens: list[UsuarioResponse]
    total: int
    pagina: int
    tamanho: int
