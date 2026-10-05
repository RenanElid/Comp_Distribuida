from datetime import date

from pydantic import BaseModel, ConfigDict, Field

PADRAO_EMAIL = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class AlunoCreate(BaseModel):
    email: str = Field(pattern=PADRAO_EMAIL, max_length=255)
    senha: str = Field(min_length=8, max_length=72)
    matricula: str = Field(min_length=1, max_length=20)
    nome: str = Field(min_length=1, max_length=150)
    data_nascimento: date
    endereco: str | None = Field(default=None, max_length=255)
    contato: str | None = Field(default=None, max_length=100)


class AlunoUpdate(BaseModel):
    matricula: str | None = Field(default=None, min_length=1, max_length=20)
    nome: str | None = Field(default=None, min_length=1, max_length=150)
    data_nascimento: date | None = None
    endereco: str | None = Field(default=None, max_length=255)
    contato: str | None = Field(default=None, max_length=100)


class AlunoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int
    matricula: str
    nome: str
    data_nascimento: date
    endereco: str | None
    contato: str | None


class AlunoPagina(BaseModel):
    itens: list[AlunoResponse]
    total: int
    pagina: int
    tamanho: int
