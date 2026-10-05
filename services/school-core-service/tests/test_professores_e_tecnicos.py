def test_listar_professores(client, headers_aluno):
    resposta = client.get("/professores", headers=headers_aluno)

    assert resposta.status_code == 200
    assert len(resposta.json()) >= 3


def test_atribuicoes_do_professor(client, headers_professor):
    resposta = client.get("/professores/1/atribuicoes", headers=headers_professor)

    assert resposta.status_code == 200
    assert {atribuicao["turma_id"] for atribuicao in resposta.json()} == {1, 2}


def test_criar_e_excluir_professor(client, headers_admin, user_service_falso):
    resposta = client.post(
        "/professores",
        json={"email": "nova.prof@distrischool.test", "senha": "Senha@123", "nome": "Nova Professora"},
        headers=headers_admin,
    )
    assert resposta.status_code == 201
    assert user_service_falso["criados"][0]["perfil"] == "TEACHER"
    professor_id = resposta.json()["id"]

    resposta = client.delete(f"/professores/{professor_id}", headers=headers_admin)
    assert resposta.status_code == 204


def test_nao_exclui_professor_com_atribuicoes(client, headers_admin, user_service_falso):
    resposta = client.delete("/professores/1", headers=headers_admin)

    assert resposta.status_code == 409
    assert user_service_falso["desativados"] == []


def test_criar_tecnico(client, headers_admin, user_service_falso):
    resposta = client.post(
        "/tecnicos",
        json={"email": "novo.tecnico@distrischool.test", "senha": "Senha@123", "nome": "Novo Técnico", "cargo": "Secretário"},
        headers=headers_admin,
    )

    assert resposta.status_code == 201
    assert user_service_falso["criados"][0]["perfil"] == "ADMIN"


def test_professor_nao_acessa_tecnicos(client, headers_professor):
    resposta = client.get("/tecnicos", headers=headers_professor)

    assert resposta.status_code == 403
