from tests.conftest import fazer_login


def test_listar_usuarios_por_perfil(client, headers_admin):
    resposta = client.get("/usuarios", params={"perfil": "TEACHER"}, headers=headers_admin)

    assert resposta.status_code == 200
    assert resposta.json()["total"] == 3
    assert all(usuario["perfil"] == "TEACHER" for usuario in resposta.json()["itens"])


def test_listar_usuarios_com_paginacao(client, headers_admin):
    resposta = client.get("/usuarios", params={"pagina": 2, "tamanho": 5}, headers=headers_admin)

    assert resposta.status_code == 200
    assert len(resposta.json()["itens"]) == 5
    assert resposta.json()["itens"][0]["id"] == 6


def test_professor_nao_acessa_usuarios(client, headers_professor):
    resposta = client.get("/usuarios", headers=headers_professor)

    assert resposta.status_code == 403


def test_criar_atualizar_e_desativar_usuario(client, headers_admin):
    resposta = client.post(
        "/usuarios",
        json={"email": "Novo.Aluno@distrischool.test", "senha": "Senha@123", "perfil": "STUDENT"},
        headers=headers_admin,
    )
    assert resposta.status_code == 201
    usuario = resposta.json()
    assert usuario["email"] == "novo.aluno@distrischool.test"
    assert usuario["email_verificado"] is False

    resposta = client.put(f"/usuarios/{usuario['id']}", json={"perfil": "PARENT"}, headers=headers_admin)
    assert resposta.status_code == 200
    assert resposta.json()["perfil"] == "PARENT"

    resposta = client.delete(f"/usuarios/{usuario['id']}", headers=headers_admin)
    assert resposta.status_code == 204

    resposta = client.post("/auth/login", json={"email": "novo.aluno@distrischool.test", "senha": "Senha@123"})
    assert resposta.status_code == 403


def test_criar_usuario_com_email_repetido(client, headers_admin):
    resposta = client.post(
        "/usuarios",
        json={"email": "carla.tecnica@distrischool.test", "senha": "Senha@123", "perfil": "ADMIN"},
        headers=headers_admin,
    )

    assert resposta.status_code == 409


def test_criar_usuario_com_dados_invalidos(client, headers_admin):
    resposta = client.post(
        "/usuarios",
        json={"email": "sem-arroba", "senha": "123", "perfil": "DIRETOR"},
        headers=headers_admin,
    )

    assert resposta.status_code == 422


def test_buscar_usuario_inexistente(client, headers_admin):
    resposta = client.get("/usuarios/9999", headers=headers_admin)

    assert resposta.status_code == 404


def test_novo_usuario_consegue_fazer_login(client, headers_admin):
    client.post(
        "/usuarios",
        json={"email": "pai.novo@distrischool.test", "senha": "Senha@123", "perfil": "PARENT"},
        headers=headers_admin,
    )

    fazer_login(client, "pai.novo@distrischool.test")
