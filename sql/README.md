# SQL - DistriSchool

Migrations Flyway (PostgreSQL 17) dos servicos. Cada servico tem o seu proprio banco, e nao existe foreign key entre eles.

> Spec 001 (arquitetura distribuida): o antigo `school_db` foi dividido em `administrativo_db`, `alunos_db` e `academico_db`. A pasta `school-core-service/` saiu (continua no historico do git).

## Estrutura

```
sql/
  user-service/            banco: user_db
    V1__criar_usuarios.sql
    V2__criar_tokens_recuperacao.sql
    V3__seed_usuarios.sql
  administrativo-service/  banco: administrativo_db
    V1__criar_professores.sql
    V2__criar_tecnicos_administrativos.sql
    V3__criar_disciplinas.sql
    V4__criar_turmas.sql
    V5__criar_atribuicoes.sql
    V6__seed_dados_ficticios.sql
  alunos-service/          banco: alunos_db
    V1__criar_alunos.sql
    V2__seed_alunos.sql
  academico-service/       banco: academico_db
    V1__criar_matriculas.sql
    V2__criar_notas.sql
    V3__criar_frequencias.sql
    V4__seed_matriculas.sql
```

## Ordem de execucao

Execute os arquivos de cada pasta na ordem do numero da versao (V1, V2, V3...). A ordem importa por causa das foreign keys dentro de cada banco:

- user_db: `usuarios` antes de `tokens_recuperacao`.
- administrativo_db: `professores`, `disciplinas` e `turmas` antes de `atribuicoes`.
- alunos_db: so tem a tabela `alunos`.
- academico_db: `matriculas` antes de `notas` e `frequencias`.

Os bancos sao independentes entre si, entao podem ser executados em qualquer ordem um em relacao ao outro. Os seeds usam ids que precisam bater entre os bancos (sem foreign key):

- `usuario_id` em `alunos`, `professores` e `tecnicos_administrativos` corresponde aos IDs fixos do seed do user_db.
- `aluno_id` e `turma_id` em `matriculas` (academico_db) correspondem aos alunos 1-10 do alunos_db e as turmas 1-2 do administrativo_db. Esses ids vem das sequences comecando em 1, entao os seeds precisam rodar num banco vazio.

## No Docker Compose

No `docker compose up`, o Flyway roda sozinho: um container `flyway-<servico>` por banco aplica os arquivos da pasta do servico, na ordem, e termina. Nao precisa fazer nada a mao (ver [docs/docker.md](../docs/docker.md)).

## Como rodar no pgAdmin

1. Crie os quatro bancos (uma vez so): clique com o botao direito em Databases, depois Create, depois Database. Crie `user_db`, `administrativo_db`, `alunos_db` e `academico_db`.
2. Selecione `user_db` na arvore e abra o Query Tool (menu Tools, Query Tool).
3. Abra cada arquivo de `sql/user-service/` pelo icone de pasta (Open File), na ordem V1, V2, V3, e execute com F5.
4. Repita o processo para cada banco com a pasta dele: `administrativo_db` com `sql/administrativo-service/`, `alunos_db` com `sql/alunos-service/` e `academico_db` com `sql/academico-service/`.
5. Confira: 16 usuarios no user_db, 2 turmas no administrativo_db, 10 alunos no alunos_db e 10 matriculas no academico_db.

Atencao: os arquivos nao sao reentrantes. Rodar o mesmo arquivo duas vezes gera erro de tabela ja existente. Para recomecar, apague e recrie o banco.

## Dados de teste (seed)

- Senha de todos os usuarios: `Senha@123` (hash BCrypt, custo 10, gravado em `senha_hash`).
- Usuarios (user_db): IDs 1-2 sao ADMIN (tecnicos), 3-5 TEACHER, 6-15 STUDENT e 16 PARENT.
- Administrativo (administrativo_db): 3 professores, 2 tecnicos administrativos, 3 disciplinas, 2 turmas e 6 atribuicoes.
- Alunos (alunos_db): 10 alunos.
- Academico (academico_db): 10 matriculas (alunos 1-5 na turma 1, alunos 6-10 na turma 2). Notas e frequencias comecam vazias.
- O seed e uma migration versionada (o ultimo V de cada pasta). Se o Flyway for usado nos servicos, ele tambem rodara em ambientes que nao sejam de desenvolvimento. Para evitar isso, mova os arquivos de seed para uma pasta separada e aponte `spring.flyway.locations` para ela apenas no perfil de desenvolvimento.

## Regras seguidas

- Nomes de tabelas e colunas em portugues, comentarios em ingles.
- Sem foreign key entre bancos: `usuario_id` em `alunos`, `professores` e `tecnicos_administrativos`, e `aluno_id` e `turma_id` em `matriculas` (academico_db), sao apenas numeros.
- Dentro do academico_db, `notas` e `frequencias` apontam para `matriculas` com foreign key e `ON DELETE CASCADE`: quando a matricula some, as notas e a frequencia dela somem junto.
- Indices em `alunos.matricula` e `alunos.nome`.
