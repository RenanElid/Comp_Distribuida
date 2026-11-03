import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.eventos import fechar_produtor
from app.routes import auth, usuarios

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield
    fechar_produtor()


app = FastAPI(title="DistriSchool - User Service", lifespan=lifespan)
app.include_router(auth.router)
app.include_router(usuarios.router)


@app.get("/health", tags=["Health"])
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(status_code=503, content={"status": "erro", "banco": "indisponível"})
    return {"status": "ok"}
