from pydantic import BaseModel, ConfigDict

class MatriculaCreate(BaseModel):
    aluno_id: int
    turma_id: int

class MatriculaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    aluno_id: int
    turma_id: int
