# Docker (semanas 3-4)

O `compose.yaml` sobe o sistema inteiro:

| Container | O que é |
| --- | --- |
| `gateway` | Nginx, porta 8080. Única porta que o frontend usa |
| `user-service`, `administrativo-service`, `alunos-service`, `academico-service` | Os 4 serviços (portas 8001 a 8004, para o Swagger) |
| `db-user`, `db-administrativo`, `db-alunos`, `db-academico` | Um PostgreSQL 17 por serviço |
| `flyway-user`, `flyway-administrativo`, `flyway-alunos`, `flyway-academico` | Criam as tabelas de cada banco e terminam |
| `kafka` | Broker dos eventos (ver [kafka.md](kafka.md)) |

## Iniciar

O passo a passo completo (criar os `.env`, trocar a senha e a chave do JWT) está no [README.md da raiz](../README.md). Na raiz do repositório, com o Docker ativo:

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps -a
```

Espere todos ficarem `healthy`. Os 4 `flyway-...` terminam com `Exited (0)`.

A ordem de subida é automática:

1. cada banco sobe e fica `healthy`;
2. o Flyway daquele banco roda as migrations de `sql/<serviço>/` e termina;
3. só então o serviço sobe;
4. o gateway sobe quando os 4 serviços estão `healthy`.

O Flyway roda de novo a cada `docker compose up`. Quando não há migration nova, ele só confere e termina (`Schema "public" is up to date`).

## Bancos

| Banco | Container | Serviço |
| --- | --- | --- |
| `user_db` | `db-user` | user-service |
| `administrativo_db` | `db-administrativo` | administrativo-service |
| `alunos_db` | `db-alunos` | alunos-service |
| `academico_db` | `db-academico` | academico-service |

Os 4 bancos **não** publicam porta no computador: só o serviço e o Flyway acessam, pela rede do Compose, na porta 5432. Usuário e senha vêm do `POSTGRES_USER` e do `POSTGRES_PASSWORD` do `.env` da raiz. Cada banco guarda os dados no seu volume (`user_db_data`, `administrativo_db_data`, `alunos_db_data` e `academico_db_data`).

Para consultar um banco pelo terminal:

```bash
docker compose exec db-alunos psql -U distrischool -d alunos_db -c "SELECT COUNT(*) FROM alunos;"
```

Para ver o resultado do Flyway:

```bash
docker compose logs flyway-academico
```

Se alterar `POSTGRES_USER`, use o novo usuário no comando `psql`. As migrations ficam em `sql/`; a ordem e os dados de teste estão em [sql/README.md](../sql/README.md).

## Portas no computador

| Porta | Container |
| --- | --- |
| 8080 (`GATEWAY_PORT`) | gateway |
| 8001, 8002, 8003 | user-service, administrativo-service, alunos-service |
| 8004 a 8006 | academico-service (uma porta por cópia, com `--scale`) |
| 9092 (`KAFKA_PORT`) | kafka |

Todas as portas ficam acessíveis apenas no próprio computador (`127.0.0.1`). Os arquivos `.env` são locais e não entram no Git.

Para rodar 3 cópias do acadêmico, consulte o [README.md da raiz](../README.md). Para o Kafka, consulte [kafka.md](kafka.md).
