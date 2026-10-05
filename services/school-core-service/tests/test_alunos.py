from app.config import settings


def dados_novo_aluno(matricula: str) -> dict:
    return {
        "email": f"aluno{matricula}@distrischool.test",
        "senha": "Senha@123",
        "matricula": matricula,
        "nome": "Aluno Novo",
        "data_nascimento": "2010-04-01",
    }


def test_listar_alunos_do_seed(client, headers_admin):
    resposta = client.get("/alunos", headers=headers_admin)

    assert resposta.status_code == 200
    assert resposta.json()["total"] >= 10


def test_buscar_aluno_por_matricula(client, headers_professor):
    resposta = client.get("/alunos", params={"matricula": "2026003"}, headers=headers_professor)

    assert resposta.json()["total"] == 1
    assert resposta.json()["itens"][0]["nome"] == "Carlos Mendes"


def test_buscar_aluno_por_nome(client, headers_admin):
    resposta = client.get("/alunos", params={"nome": "souza"}, headers=headers_admin)

    assert [aluno["nome"] for aluno in resposta.json()["itens"]] == ["Ana Souza"]


def test_buscar_alunos_por_turma(client, headers_admin):
    resposta = client.get("/alunos", params={"turma_id": 2}, headers=headers_admin)

    assert resposta.json()["total"] == 5


def test_aluno_nao_pode_listar_alunos(client, headers_aluno):
    resposta = client.get("/alunos", headers=headers_aluno)

    assert resposta.status_code == 403


def test_sem_token_nao_acessa(client):
    resposta = client.get("/alunos")

    assert resposta.status_code in (401, 403)


def test_criar_atualizar_e_excluir_aluno(client, headers_admin, user_service_falso):
    resposta = client.post("/alunos", json=dados_novo_aluno("2026100"), headers=headers_admin)
    assert resposta.status_code == 201
    aluno = resposta.json()
    assert user_service_falso["criados"] == [{"email": "aluno2026100@distrischool.test", "perfil": "STUDENT"}]
    assert aluno["usuario_id"] == 1001

    resposta = client.put(f"/alunos/{aluno['id']}", json={"contato": "(85) 90000-0000"}, headers=headers_admin)
    assert resposta.status_code == 200
    assert resposta.json()["contato"] == "(85) 90000-0000"
    assert resposta.json()["nome"] == "Aluno Novo"

    resposta = client.delete(f"/alunos/{aluno['id']}", headers=headers_admin)
    assert resposta.status_code == 204
    assert user_service_falso["desativados"] == [1001]
    assert client.get(f"/alunos/{aluno['id']}", headers=headers_admin).status_code == 404


def test_criar_aluno_com_matricula_repetida(client, headers_admin, user_service_falso):
    resposta = client.post("/alunos", json=dados_novo_aluno("2026001"), headers=headers_admin)

    assert resposta.status_code == 409
    assert user_service_falso["criados"] == []


def test_professor_nao_pode_criar_aluno(client, headers_professor, user_service_falso):
    resposta = client.post("/alunos", json=dados_novo_aluno("2026101"), headers=headers_professor)

    assert resposta.status_code == 403


def test_criar_aluno_com_user_service_fora_do_ar(client, headers_admin, monkeypatch):
    monkeypatch.setattr(settings, "user_service_url", "http://127.0.0.1:1")

    resposta = client.post("/alunos", json=dados_novo_aluno("2026102"), headers=headers_admin)

    assert resposta.status_code == 503
    assert client.get("/alunos", params={"matricula": "2026102"}, headers=headers_admin).json()["total"] == 0
