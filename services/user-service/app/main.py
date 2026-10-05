import logging

from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.routes import auth, usuarios

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="DistriSchool - User Service")
app.include_router(auth.router)
app.include_router(usuarios.router)


@app.get("/health", tags=["Health"])
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(status_code=503, content={"status": "erro", "banco": "indisponível"})
    return {"status": "ok"}
