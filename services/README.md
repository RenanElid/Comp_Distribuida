# Backend - DistriSchool

Dois serviços em Python + FastAPI, cada um com seu próprio banco PostgreSQL:

| Serviço | Porta | Banco | Responsável por |
| --- | --- | --- | --- |
| `user-service` | 8001 | `user_db` | Login (JWT), usuários, recuperação de senha, verificação de email |
| `school-core-service` | 8002 | `school_db` | Alunos, professores, técnicos, disciplinas, turmas, matrículas e atribuições |

Documentação interativa de cada serviço (Swagger): `http://localhost:8001/docs` e `http://localhost:8002/docs`.

## Organização do código

```
app/
  main.py          cria o app, registra as rotas e o /health
  config.py        variáveis de ambiente
  database.py      conexão com o banco
  security.py      validação do JWT e permissões por perfil
  eventos.py       publicação de eventos (por enquanto só no log; depois Kafka)
  models/          tabelas do banco (SQLAlchemy)
  schemas/         dados de entrada e saída da API (Pydantic)
  repositories/    consultas ao banco
  services/        regras de negócio
  routes/          endpoints
```

O fluxo de uma requisição é: `routes` → `services` → `repositories` → banco.

## Variáveis de ambiente

**user-service**

| Variável | Exemplo |
| --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://distrischool:senha@db:5432/user_db` |
| `JWT_SECRET` | chave com pelo menos 32 caracteres |
| `JWT_EXPIRACAO_MINUTOS` | `60` (opcional) |
| `FRONTEND_URL` | `http://localhost:3000` (opcional, usado nos links de email) |

**school-core-service**

| Variável | Exemplo |
| --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://distrischool:senha@db:5432/school_db` |
| `JWT_SECRET` | **a mesma chave do user-service** |
| `USER_SERVICE_URL` | `http://user-service:8001` |

## Para quem cuida da infraestrutura

- As tabelas **não** são criadas pelos serviços. As migrations de `sql/user-service` e `sql/school-core-service` precisam rodar antes (por exemplo, com um container Flyway no compose).
- Os dois serviços precisam do mesmo `JWT_SECRET`.
- Cada serviço tem `Dockerfile` e responde `GET /health` (200 quando o banco está ok, 503 quando não está).
- As rotas não têm o prefixo `/api`. Exemplo para o Nginx:

```nginx
location /api/auth/       { proxy_pass http://user-service:8001/auth/; }
location /api/usuarios    { proxy_pass http://user-service:8001/usuarios; }
location /api/alunos      { proxy_pass http://school-core-service:8002/alunos; }
location /api/professores { proxy_pass http://school-core-service:8002/professores; }
location /api/tecnicos    { proxy_pass http://school-core-service:8002/tecnicos; }
location /api/disciplinas { proxy_pass http://school-core-service:8002/disciplinas; }
location /api/turmas      { proxy_pass http://school-core-service:8002/turmas; }
```

## Endpoints

Todas as rotas, menos login, recuperação de senha e verificação de email, exigem o header `Authorization: Bearer <token>`.

**user-service**

| Método | Rota | Quem pode |
| --- | --- | --- |
| POST | `/auth/login` | todos |
| GET | `/auth/me` | logado |
| POST | `/auth/recuperar-senha` | todos |
| POST | `/auth/redefinir-senha` | todos (com o token do email) |
| POST | `/auth/enviar-verificacao` | logado |
| GET | `/auth/verificar-email?token=` | todos (com o token do email) |
| GET, POST | `/usuarios` | ADMIN |
| GET, PUT, DELETE | `/usuarios/{id}` | ADMIN (DELETE só desativa a conta) |

**school-core-service**

| Método | Rota | Quem pode |
| --- | --- | --- |
| GET | `/alunos?matricula=&nome=&turma_id=&pagina=&tamanho=` | ADMIN, TEACHER |
| GET | `/alunos/{id}` | ADMIN, TEACHER |
| POST, PUT, DELETE | `/alunos`, `/alunos/{id}` | ADMIN |
| GET | `/professores`, `/professores/{id}`, `/professores/{id}/atribuicoes` | logado |
| POST, PUT, DELETE | `/professores`, `/professores/{id}` | ADMIN |
| GET, POST, PUT, DELETE | `/tecnicos`, `/tecnicos/{id}` | ADMIN |
| GET | `/disciplinas`, `/turmas`, `/turmas/{id}`, `/turmas/{id}/atribuicoes` | logado |
| POST, PUT, DELETE | `/disciplinas`, `/turmas` e os `/{id}` | ADMIN |
| GET | `/turmas/{id}/alunos` | ADMIN, TEACHER |
| POST, DELETE | `/turmas/{id}/alunos`, `/turmas/{id}/alunos/{aluno_id}` | ADMIN |
| POST, DELETE | `/turmas/{id}/atribuicoes`, `/turmas/{id}/atribuicoes/{atribuicao_id}` | ADMIN |

Ao cadastrar um aluno, professor ou técnico, o school-core-service chama o user-service para criar o login (com o perfil STUDENT, TEACHER ou ADMIN) e depois grava o cadastro no `school_db`. Ao excluir, o login é desativado.

Eventos já publicados (no log, até o Kafka entrar): `user.logged`, `student.created`, `teacher.assigned`.

## Rodar localmente

Com o banco do `compose.yaml` no ar e as migrations aplicadas:

```bash
cd services/user-service
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
cp .env.example .env
.venv/bin/uvicorn app.main:app --reload --port 8001
```

O school-core-service é igual, na pasta `services/school-core-service` e com `--port 8002`.

## Testes

Os testes criam um banco próprio (`user_db_teste` / `school_db_teste`), rodam as migrations da pasta `sql/` e usam o seed. Eles precisam de um PostgreSQL acessível em `TEST_DATABASE_ADMIN_URL` (padrão: `postgresql://postgres:postgres@localhost:55432/postgres`). Um jeito rápido de subir um:

```bash
docker run -d --rm --name distrischool-teste-db -e POSTGRES_PASSWORD=postgres -p 127.0.0.1:55432:5432 postgres:17
```

Depois, dentro da pasta de cada serviço:

```bash
.venv/bin/pytest
```
