# Comp_Distribuida

Trabalho da cadeira de computação distribuída pela Universidade de Fortaleza, UNIFOR.

## DistriSchool

Sistema de gestão escolar dividido em serviços independentes:

- **4 serviços** em Python + FastAPI: `user-service` (login e usuários), `administrativo-service` (professores, técnicos, disciplinas e turmas), `alunos-service` (cadastro de alunos) e `academico-service` (matrículas, notas e frequência).
- **Um banco PostgreSQL por serviço**, cada um no seu container. Nenhum serviço lê o banco de outro.
- **API Gateway (Nginx)** na porta 8080: é a única porta que o frontend usa. Ele repassa `/api/...` para o serviço certo e cuida do CORS.
- **Kafka** para os eventos entre os serviços. Por exemplo, quando um aluno é excluído, o acadêmico recebe o evento e apaga as matrículas dele.
- **Flyway** cria as tabelas de cada banco com o SQL de `sql/`.

Mais detalhes:

- Serviços, rotas e variáveis: [services/README.md](services/README.md)
- Containers e bancos: [docs/docker.md](docs/docker.md)
- Eventos entre os serviços: [docs/eventos.md](docs/eventos.md)
- Broker Kafka: [docs/kafka.md](docs/kafka.md)
- SQL e dados de teste: [sql/README.md](sql/README.md)

## Como subir do zero

Precisa do Docker (Docker Desktop ou OrbStack) aberto. Todos os comandos são rodados na raiz do repositório.

**1. Criar os arquivos `.env`** (um na raiz, para a infraestrutura, e um em cada serviço):

```bash
cp .env.example .env
for servico in user administrativo alunos academico; do
  cp services/$servico-service/.env.example services/$servico-service/.env
done
```

**2. Trocar a senha do banco e a chave do JWT.** A senha tem que ser a mesma no `.env` da raiz e nos 4 serviços, e a chave do JWT tem que ser **igual nos 4 serviços**. Os comandos abaixo fazem isso de uma vez (use uma senha sem `/`, `@` e `:`):

```bash
SENHA=minha-senha-local
CHAVE=$(python3 -c "import secrets; print(secrets.token_urlsafe(40))")
sed -i '' "s/troque-esta-senha-local/$SENHA/" .env services/*/.env
sed -i '' "s/troque-por-uma-chave-com-pelo-menos-32-caracteres/$CHAVE/" services/*/.env
```

**3. Subir tudo:**

```bash
docker compose up -d --build
```

**4. Conferir:**

```bash
docker compose ps -a
```

O gateway, os 4 serviços, os 4 bancos e o Kafka devem aparecer como `healthy`. Os 4 `flyway-...` aparecem como `Exited (0)`: eles criam as tabelas e terminam.

**5. Fazer login pelo gateway** com um usuário de teste do seed:

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "carla.tecnica@distrischool.test", "senha": "Senha@123"}'
```

A resposta traz o `access_token`. Para guardar o token e usar nas outras rotas:

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "carla.tecnica@distrischool.test", "senha": "Senha@123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

curl -s http://localhost:8080/api/alunos -H "Authorization: Bearer $TOKEN"
```

Todos os usuários do seed usam a senha `Senha@123` (a lista está em [sql/README.md](sql/README.md)).

## Rodar com 3 cópias do acadêmico

```bash
docker compose up -d --scale academico-service=3
```

O gateway reveza as requisições entre as 3 cópias. Para ver qual cópia atendeu cada requisição:

```bash
docker compose logs academico-service
```

**Atenção:** qualquer `docker compose up -d` sem o `--scale academico-service=3` volta o acadêmico para 1 cópia. Para manter as 3, repita sempre o `--scale`.
