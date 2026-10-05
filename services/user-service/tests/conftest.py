import os
from pathlib import Path

import psycopg
import pytest

URL_ADMIN = os.getenv("TEST_DATABASE_ADMIN_URL", "postgresql://postgres:postgres@localhost:55432/postgres")
BANCO_TESTE = "user_db_teste"
PASTA_SQL = Path(__file__).resolve().parents[3] / "sql" / "user-service"


def numero_da_versao(arquivo: Path) -> int:
    return int(arquivo.name[1:].split("__")[0])


# Recria o banco de teste do zero e roda as migrations de sql/user-service (com o seed).
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
os.environ["JWT_SECRET"] = "chave-de-teste-com-pelo-menos-32-caracteres"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

SENHA_SEED = "Senha@123"


@pytest.fixture
def client():
    return TestClient(app)


def fazer_login(client, email: str, senha: str = SENHA_SEED) -> dict:
    resposta = client.post("/auth/login", json={"email": email, "senha": senha})
    assert resposta.status_code == 200, resposta.text
    return {"Authorization": f"Bearer {resposta.json()['access_token']}"}


@pytest.fixture
def headers_admin(client):
    return fazer_login(client, "carla.tecnica@distrischool.test")


@pytest.fixture
def headers_professor(client):
    return fazer_login(client, "marcos.prof@distrischool.test")


@pytest.fixture
def emails_enviados(monkeypatch):
    enviados = []

    def enviar_email_falso(destinatario, assunto, mensagem):
        enviados.append({"destinatario": destinatario, "assunto": assunto, "mensagem": mensagem})

    monkeypatch.setattr("app.services.auth_service.enviar_email", enviar_email_falso)
    return enviados
