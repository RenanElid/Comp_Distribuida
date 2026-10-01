# SQL - DistriSchool (semanas 1-2)

Migrations Flyway (PostgreSQL 17) dos dois servicos. Cada servico tem o seu proprio banco, e nao existe foreign key entre eles.

## Estrutura

```
sql/
  user-service/            banco: user_db
    V1__criar_usuarios.sql
    V2__criar_tokens_recuperacao.sql
    V3__seed_usuarios.sql
  school-core-service/     banco: school_db
    V1__criar_alunos.sql
    V2__criar_professores.sql
    V3__criar_tecnicos_administrativos.sql
    V4__criar_disciplinas.sql
    V5__criar_turmas.sql
    V6__criar_matriculas.sql
    V7__criar_atribuicoes.sql
    V8__seed_dados_ficticios.sql
```

## Ordem de execucao

Execute os arquivos de cada pasta na ordem do numero da versao (V1, V2, V3...). A ordem importa por causa das foreign keys dentro de cada banco:

- user_db: `usuarios` antes de `tokens_recuperacao`.
- school_db: `alunos`, `professores`, `disciplinas` e `turmas` antes de `matriculas` e `atribuicoes`.

Os dois bancos sao independentes entre si, entao podem ser executados em qualquer ordem um em relacao ao outro. O seed do school_db usa `usuario_id` fixos que correspondem aos IDs do seed do user_db.

## Como rodar no pgAdmin

1. Crie os dois bancos (uma vez so): clique com o botao direito em Databases, depois Create, depois Database. Crie `user_db` e `school_db`.
2. Selecione `user_db` na arvore e abra o Query Tool (menu Tools, Query Tool).
3. Abra cada arquivo de `sql/user-service/` pelo icone de pasta (Open File), na ordem V1, V2, V3, e execute com F5.
4. Repita o processo selecionando `school_db` e executando os arquivos de `sql/school-core-service/`, de V1 ate V8.
5. Confira: `SELECT COUNT(*) FROM usuarios;` deve retornar 16 e `SELECT COUNT(*) FROM alunos;` deve retornar 10.

Atencao: os arquivos nao sao reentrantes. Rodar o mesmo arquivo duas vezes gera erro de tabela ja existente. Para recomecar, apague e recrie o banco.

## Dados de teste (seed)

- Senha de todos os usuarios: `Senha@123` (hash BCrypt, custo 10, gravado em `senha_hash`).
- Usuarios (user_db): IDs 1-2 sao ADMIN (tecnicos), 3-5 TEACHER, 6-15 STUDENT e 16 PARENT.
- Escola (school_db): 10 alunos, 3 professores, 2 tecnicos administrativos, 3 disciplinas, 2 turmas, matriculas e atribuicoes.
- O seed e uma migration versionada (V3 e V8). Se o Flyway for usado nos servicos, ele tambem rodara em ambientes que nao sejam de desenvolvimento. Para evitar isso, mova os arquivos de seed para uma pasta separada e aponte `spring.flyway.locations` para ela apenas no perfil de desenvolvimento.

## Regras seguidas

- Nomes de tabelas e colunas em portugues, comentarios em ingles.
- Sem foreign key entre `user_db` e `school_db`: `usuario_id` em `alunos`, `professores` e `tecnicos_administrativos` e apenas um numero.
- Indices em `alunos.matricula` e `alunos.nome`.
