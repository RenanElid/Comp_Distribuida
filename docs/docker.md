# Docker (semanas 1-2)

O `compose.yaml` sobe um PostgreSQL 17. Na primeira inicialização, o script em `docker/postgres/initdb/` cria os dois bancos definidos em `sql/README.md`: `user_db` e `school_db`.

## Iniciar no Windows

1. Abra o Docker Desktop e espere o mecanismo ficar ativo.
2. Na raiz do repositório, crie o `.env` se ainda não existir:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Troque `POSTGRES_PASSWORD` no `.env` por uma senha local e execute:

   ```powershell
   docker compose config
   docker compose up -d db
   docker compose ps
   ```

4. Confira se os dois bancos foram criados:

   ```powershell
   docker compose exec db psql -U distrischool -d postgres -c "SELECT datname FROM pg_database WHERE datname IN ('user_db', 'school_db') ORDER BY datname;"
   ```

Se alterar `POSTGRES_USER`, use o novo usuário no comando `psql`.

## Conexão

| Banco | A partir de outro container | A partir do computador |
| --- | --- | --- |
| Usuários | `db:5432/user_db` | `localhost:5432/user_db` |
| Escola | `db:5432/school_db` | `localhost:5432/school_db` |

Se a porta 5432 já estiver ocupada no computador, altere `POSTGRES_PORT` no `.env`. Dentro do Compose a porta continua 5432. A porta publicada fica acessível apenas no próprio computador.

As migrations de cada banco estão em `sql/user-service/` e `sql/school-core-service/`. Elas não são executadas automaticamente por este Compose; consulte [sql/README.md](../sql/README.md) para a ordem e os dados de teste.

O script de criação dos bancos só roda quando o volume `postgres_data` está vazio. Para parar o container sem apagar os dados, use `docker compose down`. O arquivo `.env` é local e não entra no Git.
