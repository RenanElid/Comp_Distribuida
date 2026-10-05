import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
import psycopg
import pytest

URL_ADMIN = os.getenv("TEST_DATABASE_ADMIN_URL", "postgresql://postgres:postgres@localhost:55432/postgres")
BANCO_TESTE = "school_db_teste"
PASTA_SQL = Path(__file__).resolve().parents[3] / "sql" / "school-core-service"
JWT_SECRET_TESTE = "chave-de-teste-com-pelo-menos-32-caracteres"


def numero_da_versao(arquivo: Path) -> int:
    return int(arquivo.name[1:].split("__")[0])


# Recria o banco de teste do zero e roda as migrations de sql/school-core-service (com o seed).
def criar_banco_teste() -> str:
    with psycopg.connect(URL_ADMIN, autocommit=True) as conexao:
        conexao.execute(f"DROP DATABASE IF EXISTS {BANCO_TESTE} WITH (FORCE)")
        conexao.execute(f"CREATE DATABASE {BANCO_TESTE}")

    url_teste = URL_ADMIN.rsplit("/", 1)[0] + "/" + BANCO_TESTE
    with psycopg.connect(url_teste, autocommit=True) as conexao:
        for arquivo in sorted(PASTA_SQL.glob("V*.sql"), key=numero_da_versao):
            conexao.execute(arquivo.read_text())
    return url_teste


url_banco_teste = criar_banco_teste()
os.environ["DATABASE_URL"] = url_banco_teste.replace("postgresql://", "postgresql+psycopg://")
os.environ["JWT_SECRET"] = JWT_SECRET_TESTE

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def gerar_headers(usuario_id: int, perfil: str) -> dict:
    payload = {
        "sub": str(usuario_id),
        "perfil": perfil,
        "tipo": "acesso",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    token = jwt.encode(payload, JWT_SECRET_TESTE, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def headers_admin():
    return gerar_headers(1, "ADMIN")


@pytest.fixture
def headers_professor():
    return gerar_headers(3, "TEACHER")


@pytest.fixture
def headers_aluno():
    return gerar_headers(6, "STUDENT")


# Substitui as chamadas ao user-service para os testes não dependerem dele.
@pytest.fixture
def user_service_falso(monkeypatch):
    chamadas = {"criados": [], "desativados": []}

    def criar_usuario_falso(email, senha, perfil, token):
        chamadas["criados"].append({"email": email, "perfil": perfil})
        return 1000 + len(chamadas["criados"])

    def desativar_usuario_falso(usuario_id, token):
        chamadas["desativados"].append(usuario_id)

    monkeypatch.setattr("app.clients.user_service_client.criar_usuario", criar_usuario_falso)
    monkeypatch.setattr("app.clients.user_service_client.desativar_usuario", desativar_usuario_falso)
    return chamadas
