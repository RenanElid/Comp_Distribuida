# Comp_Distribuida

Trabalho da cadeira de computação distribuída pela Universidade de Fortaleza, UNIFOR.

## DistriSchool

Sistema de gestão escolar dividido em serviços independentes:

- **5 serviços** em Python + FastAPI: `user-service` (login e usuários), `administrativo-service` (professores, técnicos, disciplinas e turmas), `alunos-service` (cadastro de alunos), `academico-service` (matrículas, notas e frequência) e `comunicacao-service` (notificações).
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

Com o Docker aberto e Docker Compose 2.24 ou superior, execute na raiz de um checkout limpo:

```bash
docker compose up -d
docker compose ps -a
```

Abra o sistema em http://localhost:3000. O Compose inicia a comunicação, o Mailpit e o monitoramento junto com a aplicação. Depois de alterar o código, use `docker compose up -d --build` para reconstruir as imagens.

Os valores padrão atendem à demonstração local. Para personalizar as credenciais antes da primeira subida, copie `.env.example` para `.env` na raiz e ajuste `POSTGRES_PASSWORD`, `JWT_SECRET` e `GRAFANA_ADMIN_PASSWORD`. Use uma senha de banco segura para URLs (por exemplo, letras, números, hífen e sublinhado). Configurações existentes em `services/<serviço>/.env` têm precedência sobre os modelos dos serviços. Mantenha a senha do banco e a chave JWT consistentes entre eles ao reutilizar uma instalação.

O gateway, o frontend, os 5 serviços, os 5 bancos e o Kafka devem aparecer como `healthy`. Os 5 `flyway-...` aparecem como `Exited (0)`: eles criam as tabelas e terminam.

**Login pelo gateway** com um usuário de teste do seed:

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

## Demonstrar a infraestrutura

1. No frontend, use **Esqueci minha senha** com `carla.tecnica@distrischool.test`. Abra a [caixa do Mailpit](http://localhost:8025) para conferir a mensagem que chegou por SMTP.
2. Abra o [painel do Grafana](http://localhost:3001/d/distrischool-http). Na primeira execução com os valores padrão, entre com `admin` e `distrischool-demo`. O painel mostra disponibilidade e tempo de resposta das cinco APIs, do gateway, do frontend e do Mailpit. O [Prometheus](http://localhost:9090) coleta uma medição a cada 15 segundos.
3. Na raiz, execute `python scripts/teste_carga.py` (ou `python3`). O teste faz login uma vez e envia 200 consultas pelo gateway com até oito requisições simultâneas. Ele exibe o p95, o máximo e os códigos HTTP de cada rota. Para passar, **cada consulta** precisa retornar HTTP 200 com JSON válido em menos de dois segundos.

## Integração e entrega contínuas

Em cada pull request, o GitHub Actions constrói a aplicação, sobe o Compose e verifica o frontend, a recuperação de senha por e-mail, o monitoramento e a carga. A tabela de tempos fica no resumo da execução. Após integrar na `main`, o fluxo repete os testes e publica as seis imagens da aplicação no GitHub Container Registry com a tag `sha-<commit>`.

Para os próximos commits, a proposta para a equipe é usar `feat:` para funcionalidades, `fix:` para correções e `docs:` para documentação.

## Rodar com 3 cópias do acadêmico

```bash
docker compose up -d --scale academico-service=3
```

O gateway reveza as requisições entre as 3 cópias. Para ver qual cópia atendeu cada requisição:

```bash
docker compose logs academico-service
```

**Atenção:** qualquer `docker compose up -d` sem o `--scale academico-service=3` volta o acadêmico para 1 cópia. Para manter as 3, repita sempre o `--scale`.
