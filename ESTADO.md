# Estado do projeto: DistriSchool (Computação Distribuída)

Retrato de **04/11/2026**, tirado da branch `spec-001-arquitetura-distribuida`.
O próximo retrato substitui este.

## Onde estamos

A entrega atual vai até a etapa das **semanas 3–4** do plano (slide 08 da Entrega 1).
A parte de backend dessa etapa está pronta. Ela segue a [spec 001](specs/001-arquitetura-distribuida.md), que já está implementada.

O professor tinha dito que o projeto era um "monolito modular". Era um serviço grande (`school-core`) e os dois bancos ficavam no mesmo container. A resposta foi separar o backend de verdade:

| Serviço | Porta | Banco | O que faz |
|---|---|---|---|
| `user-service` | 8001 | `user_db` | Login, JWT e usuários |
| `administrativo-service` | 8002 | `administrativo_db` | Professores, técnicos, disciplinas, turmas e atribuições |
| `alunos-service` | 8003 | `alunos_db` | Cadastro de alunos |
| `academico-service` | 8004 | `academico_db` | Matrículas, notas e frequência |
| Gateway Nginx | 8080 | não tem | Única porta do front: rotas `/api/...`, CORS e balanceamento entre cópias |

- **Banco:** cada serviço tem o seu próprio container Postgres, e o Flyway roda as migrations de `sql/<serviço>`.
- **Comunicação síncrona (HTTP):**
  - para matricular, o acadêmico confere o aluno no alunos-service e a turma no administrativo;
  - o administrativo e o alunos-service criam o login no user-service.
- **Comunicação assíncrona (Kafka):**
  - excluir um aluno ou uma turma publica `student.deleted` ou `class.deleted`, e o consumidor do acadêmico apaga as matrículas;
  - se o acadêmico estiver fora do ar, o evento espera no Kafka;
  - os 7 eventos estão descritos em [docs/eventos.md](docs/eventos.md).
- **Configuração:** cada serviço tem o seu `services/<serviço>/.env`. O `.env` da raiz guarda só a infraestrutura.

## Como foi validado (04/11)

O teste foi feito de ponta a ponta pelo gateway, com tudo no Docker:
- login, alunos, turmas, matrícula, nota e frequência;
- excluir aluno e excluir turma, com as matrículas sumindo em cerca de 1s;
- o acadêmico desligado processando o evento quando volta;
- alunos-service fora do ar respondendo 503;
- nota lançada com o alunos-service e o administrativo desligados;
- banco do administrativo parado sem afetar alunos;
- revezamento entre 3 cópias do acadêmico;
- CORS.

## Decisões que não aparecem no código

- **Retry e circuit breaker** chegaram a ser implementados, mas foram **retirados**, porque são da etapa das semanas 5–6. O código ficou guardado fora do repositório, em `distrischool-copia-etapa2/semanas-5-6-retry-circuit-breaker/` (tem um LEIA-ME de como voltar).
- **Os testes automatizados (pytest) foram removidos** a pedido do Sávio. O professor não pede arquivos de teste até a semana 4, e só cita teste de carga na semana 7. Os 54 testes passaram antes da remoção.
- **O código fica sem comentários**, com uma linha em branco entre funções. Os comentários do SQL ficaram, porque mudar uma migration já aplicada quebra o checksum do Flyway.
- **O filtro `GET /alunos?turma_id=X` saiu:** os alunos de uma turma agora vêm de `GET /matriculas?turma_id=X`, no acadêmico.

## Time

- **Sávio:** backend e gateway.
- **Lucas:** infraestrutura e Kafka. O PR #3 dele foi mergeado em 03/11.
- **Renan:** SQL e frontend React.

## Pontas soltas

1. **Avisar o Renan:**
   - o SQL do `school-core` foi dividido em 3 pastas;
   - as rotas de matrícula agora são `/matriculas`;
   - o front deve usar só o gateway `localhost:8080`.
2. **Avisar o Lucas:**
   - o `compose.yaml` ganhou os serviços, os bancos, o Flyway e o gateway, e o bloco do Kafka não mudou;
   - o `docs/kafka.md` dele está desatualizado: ainda cita o `school-core-service`, a tabela tem só 3 eventos e diz `localhost:9092` onde, no Docker, é `kafka:19092`.
3. **Seed nas migrations versionadas:** o seed continua dentro das migrations (o último V de cada pasta) e roda sempre.
4. **Senha em texto puro:** o token de recuperação de senha ainda é gravado em texto puro no banco.
5. **Login órfão:** se o cadastro falhar depois de criar o login, o usuário fica sem cadastro. Fica para a etapa de resiliência.
6. **`lista_av2.txt` na raiz:** não é do projeto e não entra no Git.

## Como retomar

1. Abrir o PR da branch `spec-001-arquitetura-distribuida` para a `main`.
2. Para demonstrar do zero, rodar `docker compose down -v` (apaga os dados de teste) e depois `docker compose up -d --build --scale academico-service=3`. O passo a passo está no [README.md](README.md).
3. Próxima etapa (semanas 5–6): retry e circuit breaker (o código está guardado) e o serviço de notificações assíncronas.
