def criar_turma(client, headers_admin, nome: str) -> int:
    resposta = client.post("/turmas", json={"nome": nome, "ano_letivo": 2026, "turno": "NOITE"}, headers=headers_admin)
    assert resposta.status_code == 201
    return resposta.json()["id"]


def test_listar_turmas_por_ano(client, headers_aluno):
    resposta = client.get("/turmas", params={"ano_letivo": 2026}, headers=headers_aluno)

    assert resposta.status_code == 200
    assert {"9o Ano A", "9o Ano B"} <= {turma["nome"] for turma in resposta.json()}


def test_criar_turma_com_turno_invalido(client, headers_admin):
    resposta = client.post("/turmas", json={"nome": "Turma X", "ano_letivo": 2026, "turno": "MADRUGADA"}, headers=headers_admin)

    assert resposta.status_code == 422


def test_matricular_e_cancelar_matricula(client, headers_admin):
    turma_id = criar_turma(client, headers_admin, "1o Ano Noite")

    resposta = client.post(f"/turmas/{turma_id}/alunos", json={"aluno_id": 1}, headers=headers_admin)
    assert resposta.status_code == 201

    resposta = client.post(f"/turmas/{turma_id}/alunos", json={"aluno_id": 1}, headers=headers_admin)
    assert resposta.status_code == 409

    alunos = client.get(f"/turmas/{turma_id}/alunos", headers=headers_admin).json()
    assert [aluno["id"] for aluno in alunos] == [1]

    resposta = client.delete(f"/turmas/{turma_id}/alunos/1", headers=headers_admin)
    assert resposta.status_code == 204
    assert client.get(f"/turmas/{turma_id}/alunos", headers=headers_admin).json() == []


def test_matricular_aluno_inexistente(client, headers_admin):
    resposta = client.post("/turmas/1/alunos", json={"aluno_id": 9999}, headers=headers_admin)

    assert resposta.status_code == 404


def test_atribuir_professor_na_turma(client, headers_admin):
    turma_id = criar_turma(client, headers_admin, "2o Ano Noite")

    resposta = client.post(
        f"/turmas/{turma_id}/atribuicoes", json={"disciplina_id": 1, "professor_id": 2}, headers=headers_admin
    )
    assert resposta.status_code == 201
    atribuicao_id = resposta.json()["id"]

    resposta = client.post(
        f"/turmas/{turma_id}/atribuicoes", json={"disciplina_id": 1, "professor_id": 3}, headers=headers_admin
    )
    assert resposta.status_code == 409

    resposta = client.delete(f"/turmas/{turma_id}/atribuicoes/{atribuicao_id}", headers=headers_admin)
    assert resposta.status_code == 204


def test_disciplinas(client, headers_admin):
    resposta = client.post("/disciplinas", json={"nome": "Geografia", "carga_horaria": 80}, headers=headers_admin)
    assert resposta.status_code == 201
    disciplina_id = resposta.json()["id"]

    resposta = client.put(f"/disciplinas/{disciplina_id}", json={"carga_horaria": 60}, headers=headers_admin)
    assert resposta.json()["carga_horaria"] == 60

    resposta = client.post("/disciplinas", json={"nome": "Artes", "carga_horaria": 0}, headers=headers_admin)
    assert resposta.status_code == 422
