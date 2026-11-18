from datetime import datetime

from pydantic import BaseModel, ConfigDict

class NotificacaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo: str
    mensagem: str
    lida: bool
    criada_em: datetime
