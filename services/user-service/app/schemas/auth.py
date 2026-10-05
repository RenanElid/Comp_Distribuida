from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RecuperarSenhaRequest(BaseModel):
    email: str


class RedefinirSenhaRequest(BaseModel):
    token: str
    nova_senha: str = Field(min_length=8, max_length=72)


class MensagemResponse(BaseModel):
    mensagem: str
