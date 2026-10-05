from tests.conftest import fazer_login


def pegar_token_do_link(mensagem: str) -> str:
    return mensagem.split("token=")[1]


def test_login_com_sucesso(client):
    resposta = client.post("/auth/login", json={"email": "carla.tecnica@distrischool.test", "senha": "Senha@123"})

    assert resposta.status_code == 200
    assert resposta.json()["token_type"] == "bearer"


def test_login_com_senha_errada(client):
    resposta = client.post("/auth/login", json={"email": "carla.tecnica@distrischool.test", "senha": "errada"})

    assert resposta.status_code == 401


def test_login_de_usuario_desativado(client):
    resposta = client.post("/auth/login", json={"email": "igor.ferreira@distrischool.test", "senha": "Senha@123"})

    assert resposta.status_code == 403


def test_me_retorna_usuario_logado(client, headers_professor):
    resposta = client.get("/auth/me", headers=headers_professor)

    assert resposta.status_code == 200
    assert resposta.json()["email"] == "marcos.prof@distrischool.test"
    assert resposta.json()["perfil"] == "TEACHER"


def test_me_sem_token(client):
    resposta = client.get("/auth/me")

    assert resposta.status_code in (401, 403)


def test_recuperacao_de_senha(client, emails_enviados):
    email = "julia.barros@distrischool.test"

    resposta = client.post("/auth/recuperar-senha", json={"email": email})
    assert resposta.status_code == 200
    token = pegar_token_do_link(emails_enviados[0]["mensagem"])

    resposta = client.post("/auth/redefinir-senha", json={"token": token, "nova_senha": "NovaSenha@456"})
    assert resposta.status_code == 200
    fazer_login(client, email, "NovaSenha@456")

    resposta = client.post("/auth/redefinir-senha", json={"token": token, "nova_senha": "OutraSenha@789"})
    assert resposta.status_code == 400


def test_recuperacao_de_email_inexistente_nao_envia_nada(client, emails_enviados):
    resposta = client.post("/auth/recuperar-senha", json={"email": "ninguem@distrischool.test"})

    assert resposta.status_code == 200
    assert emails_enviados == []


def test_verificacao_de_email(client, emails_enviados):
    headers = fazer_login(client, "ricardo.prof@distrischool.test")

    resposta = client.post("/auth/enviar-verificacao", headers=headers)
    assert resposta.status_code == 200
    token = pegar_token_do_link(emails_enviados[0]["mensagem"])

    resposta = client.get("/auth/verificar-email", params={"token": token})
    assert resposta.status_code == 200
    assert client.get("/auth/me", headers=headers).json()["email_verificado"] is True


def test_token_de_verificacao_nao_serve_como_login(client, emails_enviados):
    headers = fazer_login(client, "eduardo.alves@distrischool.test")
    client.post("/auth/enviar-verificacao", headers=headers)
    token = pegar_token_do_link(emails_enviados[0]["mensagem"])

    resposta = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert resposta.status_code == 401
