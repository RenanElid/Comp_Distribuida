# Backend - DistriSchool

Quatro serviços em Python + FastAPI, cada um com o seu próprio banco PostgreSQL (num container só dele):

| Serviço | Porta | Banco | O que faz |
| --- | --- | --- | --- |
| `user-service` | 8001 | `user_db` | Login (JWT), usuários, recuperação de senha, verificação de email |
| `administrativo-service` | 8002 | `administrativo_db` | Professores, técnicos, disciplinas, turmas e atribuições (qual professor dá qual disciplina em qual turma) |
| `alunos-service` | 8003 | `alunos_db` | Cadastro, busca e dados do aluno |
| `academico-service` | 8004 | `academico_db` | Matrículas, notas e frequência |

O frontend fala só com o **gateway** (`http://localhost:8080`), usando as rotas com o prefixo `/api`. As portas 8001 a 8004 ficam abertas só para o Swagger de cada serviço: `http://localhost:8001/docs`, `http://localhost:8002/docs`, `http://localhost:8003/docs` e `http://localhost:8004/docs`. Com 3 cópias do acadêmico, elas ficam nas portas 8004, 8005 e 8006 (veja qual é qual com `docker compose ps academico-service`).

Como subir tudo: [README.md da raiz](../README.md).

## Organização do código

Os 4 serviços seguem o mesmo molde:

```
app/
  main.py          cria o app, registra as rotas e o /health
  config.py        variáveis de ambiente
  database.py      conexão com o banco
  security.py      validação do JWT e permissões por perfil (cópia igual em cada serviço)
  eventos.py       publicação de eventos no Kafka
  models/          tabelas do banco (SQLAlchemy)
  schemas/         dados de entrada e saída da API (Pydantic)
  repositories/    consultas ao banco
  services/        regras de negócio
  routes/          endpoints
  clients/         chamadas HTTP para outros serviços (só no administrativo, no alunos e no acadêmico)
  consumidor.py    leitura dos eventos do Kafka (só no acadêmico)
```

O fluxo de uma requisição é: `routes` → `services` → `repositories` → banco.

As tabelas **não** são criadas pelos serviços: quem cria é o Flyway, com o SQL de `sql/<serviço>/`.

## Rotas pelo gateway

Todas as rotas, menos login, recuperação de senha e verificação de email, exigem o header `Authorization: Bearer <token>`. O gateway não valida o token: ele só repassa, e cada serviço valida sozinho (todos usam o mesmo `JWT_SECRET`).

O gateway tira o `/api` antes de repassar. Por exemplo, `GET /api/alunos` chega no alunos-service como `GET /alunos`.

**user-service**

| Método | Rota | Quem pode |
| --- | --- | --- |
| POST | `/api/auth/login` | todos |
| GET | `/api/auth/me` | logado |
| POST | `/api/auth/recuperar-senha` | todos |
| POST | `/api/auth/redefinir-senha` | todos (com o token do email) |
| POST | `/api/auth/enviar-verificacao` | logado |
| GET | `/api/auth/verificar-email?token=` | todos (com o token do email) |
| GET | `/api/usuarios?perfil=&pagina=&tamanho=` | ADMIN |
| POST | `/api/usuarios` | ADMIN |
| GET, PUT, DELETE | `/api/usuarios/{id}` | ADMIN (DELETE só desativa a conta) |

**administrativo-service**

| Método | Rota | Quem pode |
| --- | --- | --- |
| GET | `/api/professores`, `/api/professores/{id}`, `/api/professores/{id}/atribuicoes` | logado |
| POST, PUT, DELETE | `/api/professores`, `/api/professores/{id}` | ADMIN |
| GET, POST, PUT, DELETE | `/api/tecnicos`, `/api/tecnicos/{id}` | ADMIN |
| GET | `/api/disciplinas`, `/api/disciplinas/{id}`, `/api/turmas?ano_letivo=`, `/api/turmas/{id}`, `/api/turmas/{id}/atribuicoes` | logado |
| POST, PUT, DELETE | `/api/disciplinas`, `/api/turmas` e os `/{id}` | ADMIN |
| POST, DELETE | `/api/turmas/{id}/atribuicoes`, `/api/turmas/{id}/atribuicoes/{atribuicao_id}` | ADMIN |

Ao cadastrar um professor ou técnico, o administrativo chama o user-service para criar o login (perfil TEACHER ou ADMIN). Ao excluir, o login é desativado.

**alunos-service**

| Método | Rota | Quem pode |
| --- | --- | --- |
| GET | `/api/alunos?matricula=&nome=&pagina=&tamanho=` | ADMIN, TEACHER |
| GET | `/api/alunos/{id}` | ADMIN, TEACHER |
| POST | `/api/alunos` | ADMIN |
| PUT, DELETE | `/api/alunos/{id}` | ADMIN |

Ao cadastrar um aluno, o alunos-service chama o user-service para criar o login (perfil STUDENT). Ao excluir, o login é desativado.

**academico-service**

Todas as rotas do acadêmico são para ADMIN ou TEACHER.

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/api/matriculas?aluno_id=&turma_id=` | Lista as matrículas (os dois filtros são opcionais) |
| POST | `/api/matriculas` | Matricula um aluno numa turma |
| DELETE | `/api/matriculas/{id}` | Cancela a matrícula (as notas e a frequência dela somem junto) |
| POST | `/api/notas` | Lança uma nota (de 0 a 10) |
| GET | `/api/notas?matricula_id=` | Lista as notas da matrícula, com a média calculada na hora |
| POST | `/api/frequencias` | Registra a frequência de um dia (`PRESENTE`, `FALTA` ou `ATRASO`) |
| GET | `/api/frequencias?matricula_id=` | Lista a frequência da matrícula |

Exemplos (com o `TOKEN` do login, como no [README.md da raiz](../README.md)):

```bash
# Matricular o aluno 6 na turma 1 -> 201 {"id": 11, "aluno_id": 6, "turma_id": 1}
curl -s -X POST http://localhost:8080/api/matriculas \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"aluno_id": 6, "turma_id": 1}'

# Matrículas da turma 1
curl -s "http://localhost:8080/api/matriculas?turma_id=1" -H "Authorization: Bearer $TOKEN"

# Lançar nota -> 201 {"id": 1, "matricula_id": 1, "descricao": "AV1", "valor": 8.5}
curl -s -X POST http://localhost:8080/api/notas \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"matricula_id": 1, "descricao": "AV1", "valor": 8.5}'

# Notas e média -> {"matricula_id": 1, "notas": [...], "media": 8.5}
curl -s "http://localhost:8080/api/notas?matricula_id=1" -H "Authorization: Bearer $TOKEN"

# Registrar frequência -> 201 {"id": 1, "matricula_id": 1, "data": "2026-11-03", "situacao": "PRESENTE"}
curl -s -X POST http://localhost:8080/api/frequencias \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"matricula_id": 1, "data": "2026-11-03", "situacao": "PRESENTE"}'
```

Respostas de erro do acadêmico:

- matrícula repetida (mesmo aluno e mesma turma) ou frequência repetida no mesmo dia: 409;
- aluno ou turma que não existe: 404 "Aluno não encontrado" ou "Turma não encontrada";
- alunos-service ou administrativo fora do ar na hora de matricular: 503 "Serviço de alunos indisponível" ou "Serviço administrativo indisponível";
- nota fora de 0 a 10 ou situação inválida: 422.

## Como os serviços conversam

- **HTTP (síncrono):**
  - o administrativo e o alunos chamam o user-service para criar e desativar logins;
  - para matricular, o acadêmico confere no alunos-service que o aluno existe (`GET /alunos/{id}`) e no administrativo que a turma existe (`GET /turmas/{id}`), repassando o mesmo token.
- **Kafka (assíncrono):**
  - excluir um aluno publica `student.deleted`, e excluir uma turma publica `class.deleted`;
  - o acadêmico consome esses dois eventos e apaga as matrículas do aluno ou da turma;
  - se o acadêmico estiver fora do ar, o evento fica esperando no Kafka e é processado quando ele volta.
- **Nota e frequência** usam só o banco do acadêmico. Por isso continuam funcionando mesmo com o alunos-service e o administrativo fora do ar.

A lista de todos os eventos, com um exemplo de cada um, está em [docs/eventos.md](../docs/eventos.md). O broker está em [docs/kafka.md](../docs/kafka.md).

Retry e circuit breaker nas chamadas HTTP ficam para a etapa das semanas 5 e 6. Por enquanto, se o outro serviço não responder, o acadêmico devolve 503 na hora.

## Variáveis de ambiente

Cada serviço tem o seu `services/<serviço>/.env`, que o `compose.yaml` carrega (`env_file`). O modelo é o `.env.example` da mesma pasta. Os endereços usam o nome do container (`db-alunos`, `kafka`, `user-service`...), não `localhost`.

O `JWT_SECRET` tem que ser **igual nos 4 serviços**. A senha dentro do `DATABASE_URL` é a mesma do `POSTGRES_PASSWORD` do `.env` da raiz.

**user-service**

| Variável | Valor no Docker |
| --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://distrischool:<senha>@db-user:5432/user_db` |
| `JWT_SECRET` | chave com pelo menos 32 caracteres |
| `JWT_EXPIRACAO_MINUTOS` | `60` (opcional) |
| `FRONTEND_URL` | `http://localhost:3000` (opcional, usado nos links dos emails) |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:19092` |

**administrativo-service**

| Variável | Valor no Docker |
| --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://distrischool:<senha>@db-administrativo:5432/administrativo_db` |
| `JWT_SECRET` | a mesma chave dos outros serviços |
| `USER_SERVICE_URL` | `http://user-service:8001` |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:19092` |

**alunos-service**

| Variável | Valor no Docker |
| --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://distrischool:<senha>@db-alunos:5432/alunos_db` |
| `JWT_SECRET` | a mesma chave dos outros serviços |
| `USER_SERVICE_URL` | `http://user-service:8001` |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:19092` |

**academico-service**

| Variável | Valor no Docker |
| --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://distrischool:<senha>@db-academico:5432/academico_db` |
| `JWT_SECRET` | a mesma chave dos outros serviços |
| `ALUNOS_SERVICE_URL` | `http://alunos-service:8003` |
| `ADMINISTRATIVO_SERVICE_URL` | `http://administrativo-service:8002` |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:19092` (sem essa variável, o consumidor do Kafka não liga) |

Sem `KAFKA_BOOTSTRAP_SERVERS`, os serviços funcionam normalmente e os eventos vão só para o log.

O `.env` da raiz guarda só a infraestrutura: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `KAFKA_PORT`, `CORS_ORIGIN` e `GATEWAY_PORT`.
