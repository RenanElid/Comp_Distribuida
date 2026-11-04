import logging
from contextlib import asynccontextmanager
from threading import Thread

from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.consumidor import parar_consumidor, rodar_consumidor
from app.database import get_db
from app.eventos import fechar_produtor
from app.routes import frequencias, matriculas, notas

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    thread_consumidor = None
    if settings.kafka_bootstrap_servers:
        parar_consumidor.clear()
        thread_consumidor = Thread(target=rodar_consumidor, name="kafka-consumidor", daemon=True)
        thread_consumidor.start()

    yield

    parar_consumidor.set()
    if thread_consumidor is not None:
        thread_consumidor.join(timeout=5)
    fechar_produtor()

app = FastAPI(title="DistriSchool - Academico Service", lifespan=lifespan)
app.include_router(matriculas.router)
app.include_router(notas.router)
app.include_router(frequencias.router)

@app.get("/health", tags=["Health"])
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(status_code=503, content={"status": "erro", "banco": "indisponível"})
    return {"status": "ok"}
