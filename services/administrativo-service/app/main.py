import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.eventos import fechar_produtor
from app.routes import disciplinas, professores, tecnicos, turmas

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield
    fechar_produtor()

app = FastAPI(title="DistriSchool - Administrativo Service", lifespan=lifespan)
app.include_router(professores.router)
app.include_router(tecnicos.router)
app.include_router(disciplinas.router)
app.include_router(turmas.router)

@app.get("/health", tags=["Health"])
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(status_code=503, content={"status": "erro", "banco": "indisponível"})
    return {"status": "ok"}
