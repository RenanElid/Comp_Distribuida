# Spec 001: Arquitetura distribuída do backend
**Status:** Implementada   **Data:** 2026-11-02
**Relacionadas:** `ESTADO.md` (crítica do professor), `services/README.md`, `docs/kafka.md` (branch `kafka-config`, do Lucas), plano das semanas 3–4
**Pré-requisito:** a branch `kafka-config` do Lucas precisa estar na `main` antes da etapa 1, porque ela mexe em arquivos do `school-core-service`, que esta spec renomeia.

## 1. Contexto
- **Como funciona hoje:**
  - Dois serviços em FastAPI. O `user-service` (8001, `user_db`) cuida de login, JWT e perfis. O `school-core-service` (8002, `school_db`) junta **alunos, professores, técnicos, disciplinas, turmas, matrículas e atribuições** num processo só e num banco só.
  - Os dois bancos ficam no mesmo container Postgres. O `compose.yaml` sobe só esse banco, e os serviços rodam soltos com `uvicorn`.
  - A única comunicação entre os serviços é HTTP síncrono, sem retry: o `school-core` chama o `user-service` para criar e desativar logins (`app/clients/user_service_client.py`).
  - Na `main`, os eventos (`student.created`, `teacher.assigned`, `user.logged`) só vão para o log (`app/eventos.py`).
  - Na branch `kafka-config` (commit `f5d6fbf`, do Lucas), o `publicar_evento` já envia os eventos para o Kafka (`confluent-kafka`), e o `compose.yaml` sobe um broker Kafka 4.3.2 em modo KRaft.
    - Formato da mensagem: `{"tipo", "ocorrido_em", "dados"}`.
    - Sem a variável `KAFKA_BOOTSTRAP_SERVERS`, os eventos continuam só no log.
    - **Não existe consumidor**: ninguém lê os eventos.
  - Não existe gateway. O exemplo de Nginx no `services/README.md` é só uma sugestão.
- **Problema observado:**
  - O professor avaliou o código atual e disse que é um **monolito modular**, não um sistema distribuído.
  - O plano das semanas 1–2 pedia serviços básicos separados (Alunos, Usuários, Professores e Técnicos), e o `school-core` juntou tudo.
  - O plano das semanas 3–4 pede: "Implementar API Gateway e outros serviços como Gestão Acadêmica (nota e frequência, matrículas) e Gestão Administrativa (alocação de turmas, professores etc.); integrar RabbitMQ/Kafka; criar frontend básico integrado ao backend".

## 2. Objetivo
- **O que fazer:**
  - Separar o backend em quatro serviços independentes, cada um com o seu banco **em um container próprio**.
  - Colocar um API Gateway (Nginx) na frente de todos.
  - Fazer a comunicação assíncrona acontecer de verdade: o `academico-service` **consome** eventos do Kafka publicados por outros serviços.
  - Deixar o backend pronto para o frontend (CORS e rotas pelo gateway).
- **Por que fazer:**
  - Responder à crítica do professor.
  - Entregar a parte de backend das semanas 3–4: gateway, Gestão Acadêmica e Gestão Administrativa.
  - Deixar o backend pronto para os colegas integrarem a mensageria e o frontend.

## 3. Decisões
- **Decidido: quatro serviços.** A divisão segue o plano das semanas 1–4:

  | Serviço | Porta | Banco | O que tem |
  |---|---|---|---|
  | `user-service` | 8001 | `user_db` | Login, JWT, perfis, recuperação de senha (não muda) |
  | `administrativo-service` | 8002 | `administrativo_db` | Professores, técnicos, disciplinas, turmas e alocação (atribuições) |
  | `alunos-service` | 8003 | `alunos_db` | Cadastro, busca e dados do aluno |
  | `academico-service` | 8004 | `academico_db` | Matrículas, notas e frequência |

  **Porque:** é a divisão do plano. "Alunos" é serviço básico das semanas 1–2, e as semanas 3–4 trazem "Gestão Administrativa" (com professores dentro) e "Gestão Acadêmica" (nota, frequência e matrículas).
- **Decidido:** o `school-core-service` é **renomeado** para `administrativo-service` e perde alunos e matrículas. **Porque:** a maior parte do código dele já é administrativa, e mover é mais barato e mais fácil de revisar do que reescrever.
- **Decidido:** nenhum serviço lê o banco de outro. Quando um serviço precisa de um dado de outro serviço, ele guarda só o **id**, como número simples, sem foreign key (como já acontece com `usuario_id`). **Porque:** é isso que torna os serviços independentes, e o modelo já usa esse padrão.
- **Decidido:** para matricular um aluno, o `academico-service` confere por **HTTP síncrono** que o aluno existe (no `alunos-service`) e que a turma existe (no `administrativo-service`), com uma chamada simples: se o serviço não responder, a resposta é 503. **Porque:**
  - funciona sem depender da mensageria, que é de outro colega;
  - cobre a "interação síncrona" que o PDF pede.
- **Decidido:** lançar **nota** e **frequência** usa só dados do próprio `academico_db` (a matrícula). **Porque:** se o administrativo ou o serviço de alunos cair, o professor continua lançando nota e fazendo chamada. Essa é a demonstração de tolerância a falhas.
- **Decidido: a mensageria é o Kafka.**
  - Os serviços novos usam o mesmo `eventos.py` da branch do Lucas: `publicar_evento(topico, dados)` e o formato `{tipo, ocorrido_em, dados}`.
  - **Porque:** o Lucas já integrou o Kafka. RabbitMQ ficou descartado.
- **Decidido: um consumidor no `academico-service`.**
  - Arquivo `app/consumidor.py`, com duas partes:
    - `tratar_evento(tipo, dados)`: a regra de negócio, testável sem Kafka;
    - um laço que lê os tópicos `student.deleted` e `class.deleted` com o `Consumer` do `confluent-kafka` (`group.id = "academico-service"`) e chama `tratar_evento`.
  - O laço roda numa thread iniciada no `lifespan` do FastAPI e só liga quando `KAFKA_BOOTSTRAP_SERVERS` estiver configurado, como o producer.
  - **Porque:**
    - sem consumidor, os eventos ficam parados no Kafka e a comunicação assíncrona não acontece de fato;
    - quem escreve o consumidor é o Sávio, porque ele fica dentro do serviço dele;
    - uma thread no mesmo processo é mais simples que um container separado só para consumir.
- **Decidido:** o contrato dos eventos fica em `docs/eventos.md`. **Porque:** o `docs/kafka.md` do Lucas explica o broker, e o `docs/eventos.md` explica o que cada evento significa para os serviços.
- **Decidido: CORS liberado no gateway** para a origem do frontend (`http://localhost:3000` por padrão, configurável). **Porque:**
  - o front chama a API por outra porta, e o navegador bloqueia essa chamada sem CORS;
  - configurar no gateway resolve para todos os serviços num lugar só.
- **Decidido: API Gateway com Nginx**, num container só dele, na porta 8080.
  - Rotas públicas com o prefixo `/api/...`, repassadas para o serviço certo sem o prefixo.
  - O gateway **não valida o JWT**: cada serviço continua validando o token.
  - **Porque:**
    - o gateway é do Sávio, e Nginx é só um arquivo de configuração, fácil de explicar;
    - a validação já existe e está testada nos serviços.
- **Decidido:** um container Postgres **por serviço** no `compose.yaml`. **Porque:** dois bancos no mesmo container continuam sendo um ponto único de falha, que é parte da crítica do professor.
- **Decidido:** os eventos continuam com os nomes em inglês do PDF de requisitos (`student.created`, `teacher.assigned`...). **Porque:** são os nomes da especificação, e o código atual já usa esse padrão.
- **Descartado: um serviço por tabela** (notas-service, frequencia-service...). **Porque:** fica complexo sem ganho, e o plano agrupa em "Gestão Acadêmica".
- **Descartado: RabbitMQ.** **Porque:** o Lucas já integrou o Kafka, que é o que o PDF de requisitos cita.
- **Descartado: um container separado só para o consumidor.** **Porque:** é mais um serviço para subir e explicar, sem ganho para o tamanho do projeto.
- **Descartado: CORS em cada serviço (`CORSMiddleware`).** **Porque:** o front só fala com o gateway, então liberar em 4 lugares seria repetição.
- **Decidido (pergunta da seção 9):** o Sávio escreve o SQL novo no mesmo formato Flyway do Renan e avisa o Renan. **Porque:** a divisão dos serviços muda onde cada tabela fica.
- **Decidido (pergunta da seção 9):** o Sávio edita o `compose.yaml` para adicionar os serviços, os bancos e o gateway, mantendo o Kafka do Lucas, e avisa o Lucas. **Porque:** o gateway é do Sávio e precisa dos serviços no compose.
- **Decidido (pergunta da seção 9):** as migrations rodam pelo container **Flyway**, um por banco. **Porque:** é o que a especificação pede, e o SQL já está nesse formato.
- **Descartado: retry e circuit breaker nesta spec** (foram implementados e retirados em 04/11). **Porque:** no plano da Entrega 1 eles são das semanas 5–6, e esta entrega mostra só até a etapa das semanas 3–4. Voltam na entrega das semanas 5–6 (o código ficou guardado em `distrischool-copia-etapa2/semanas-5-6-retry-circuit-breaker/`, fora do repositório).
- **Decidido (pergunta da seção 9):** as rotas de matrícula mudam de `/turmas/{id}/alunos` para `/matriculas` (`GET /matriculas?turma_id=X`, `POST /matriculas`, `DELETE /matriculas/{id}`). **Porque:** ainda não existe frontend usando, e a rota antiga ficaria no serviço errado.
- **Descartado: gateway em Python** (FastAPI repassando requisições). **Porque:** Nginx faz roteamento e balanceamento de carga sem nenhum código.
- **Descartado: a média calculada de forma assíncrona** (por evento) **nesta spec**. **Porque:** depende da mensageria. Por enquanto a média é calculada na hora da consulta.
- **Descartado: desfazer o login órfão** (quando o cadastro falha depois de criar o usuário) **nesta spec**. **Porque:** é uma mudança separada, que fica para uma spec própria de resiliência.

## 4. Escopo
- **Arquivos a alterar/criar:**
  - **Administrativo:** `services/school-core-service/` → `services/administrativo-service/`. Saem `aluno*`, `matricula*`, as rotas `/turmas/{id}/alunos` e o teste `test_alunos.py`.
  - **Alunos:** `services/alunos-service/`, novo, com o código de aluno que veio do `school-core` (model, schema, repository, service, rota `/alunos`, testes, `user_service_client.py`, Dockerfile).
  - **Acadêmico:** `services/academico-service/`, novo, com matrículas, notas e frequência, os clients HTTP para o alunos e o administrativo, o `app/consumidor.py` (o laço do Kafka e o `tratar_evento`), o `eventos.py` (cópia do do Lucas), os testes e o Dockerfile.
  - **Alunos:** também recebe uma cópia do `eventos.py` do Lucas.
  - **SQL:**
    - `sql/school-core-service/` → `sql/administrativo-service/`, sem as tabelas de aluno e matrícula;
    - `sql/alunos-service/` e `sql/academico-service/`, novos;
    - o seed dividido entre as três pastas.
  - **Infra:**
    - `gateway/nginx.conf`, novo, com as rotas e o CORS;
    - `compose.yaml`, com os 4 serviços, os 4 bancos, o Flyway e o gateway, mantendo o Kafka que o Lucas adicionou;
    - `docker/postgres/initdb/01-create-databases.sql`, ajustado ou removido.
  - **Documentação:** `docs/eventos.md` (novo), `services/README.md` (rotas pelo gateway, portas, variáveis) e `README.md` (como subir tudo).
- **Fora de escopo:**
  - mudar a configuração do broker Kafka ou o producer do Lucas (os serviços novos só copiam o `eventos.py`);
  - consumidores fora do `academico-service`;
  - frontend;
  - serviço de notificações;
  - relatórios por gRPC;
  - CI/CD, Prometheus e Grafana;
  - desfazer o login órfão;
  - média assíncrona.
- **Restrições (não pode quebrar):**
  - O `user-service` não muda de comportamento.
  - Todas as rotas que já existem continuam funcionando **pelo gateway**, com o mesmo formato de resposta. A exceção são as rotas de matrícula, que mudam de `/turmas/{id}/alunos` para `/matriculas` (ver seção 9).
  - Os testes que já existem continuam passando, cada um no seu serviço.
  - O mesmo `JWT_SECRET` vale para todos os serviços.
  - Sem `KAFKA_BOOTSTRAP_SERVERS`, todo serviço sobe e funciona normalmente (os eventos vão só para o log e o consumidor não liga). É assim que os testes rodam.

## 5. Diretrizes Técnicas
- **Organização do código:** igual à do `user-service`: `routes → services → repositories → banco`, sync SQLAlchemy, código simples no estilo júnior, sem camadas novas. Cada serviço tem o seu próprio `security.py` (cópia), sem pacote compartilhado, porque um pacote em comum acopla os serviços.
- **Tabelas novas do `academico_db`:**
  - `matriculas` (`id`, `aluno_id`, `turma_id`, únicos em par, sem FK para fora);
  - `notas` (`id`, `matricula_id` com FK, `descricao` como "AV1", `valor` entre 0 e 10);
  - `frequencias` (`id`, `matricula_id` com FK, `data`, `situacao` em `PRESENTE`, `FALTA` ou `ATRASO`, única por matrícula e data).
- **Chamada aos outros serviços:** uma tentativa só, com timeout de 3 segundos. Erro de conexão, timeout ou resposta 5xx viram 503.
- **Consumidor:**
  - `auto.offset.reset = "earliest"`, para não perder evento publicado enquanto o acadêmico estava fora do ar.
  - Um evento com JSON inválido ou um erro no `tratar_evento` é registrado no log e o laço segue, sem derrubar o serviço.
  - Ao desligar, o `lifespan` para o laço e fecha o consumer.
- **CORS no gateway:**
  - responder ao `OPTIONS` (preflight) com 204;
  - mandar os cabeçalhos `Access-Control-Allow-Origin` (a origem do front), `Access-Control-Allow-Methods` (`GET, POST, PUT, DELETE, OPTIONS`) e `Access-Control-Allow-Headers` (`Authorization, Content-Type`).
- **Eventos (contrato em `docs/eventos.md`):** todos no formato `{"tipo", "ocorrido_em", "dados"}`, como na branch do Lucas.

  | Evento | Quem publica | Quem consome | O que o consumidor faz |
  |---|---|---|---|
  | `user.logged` | user | (auditoria, futuro) | — |
  | `student.created` | alunos | (notificações, futuro) | — |
  | `student.deleted` | alunos | academico | cancela as matrículas do aluno |
  | `class.deleted` | administrativo | academico | cancela as matrículas da turma |
  | `teacher.assigned` | administrativo | (notificações, futuro) | — |
  | `grade.recorded` | academico | (notificações, futuro) | — |
  | `attendance.recorded` | academico | (notificações aos pais, futuro) | — |

- **Gateway:**
  - `/api/auth/` e `/api/usuarios` vão para o user.
  - `/api/alunos` vai para o alunos.
  - `/api/professores`, `/api/tecnicos`, `/api/disciplinas` e `/api/turmas` vão para o administrativo.
  - `/api/matriculas`, `/api/notas` e `/api/frequencias` vão para o acadêmico.
  - `/health` responde o status do próprio gateway.
  - Com `docker compose up --scale academico-service=3`, o Nginx distribui as requisições entre as cópias.
- **Casos de borda:**
  - O `alunos-service` ou o `administrativo-service` está fora do ar na hora de matricular: a resposta é 503 "Serviço de alunos indisponível" (ou "Serviço administrativo indisponível").
  - Matrícula repetida (mesmo aluno e mesma turma): 409.
  - Nota fora de 0–10: 422.
  - Frequência repetida no mesmo dia: 409.
  - Aluno ou turma inexistente na matrícula: 404, com a mensagem de qual dos dois não foi encontrado.
  - O `tratar_evento` recebe um evento de algo que já foi apagado: não dá erro (processar o mesmo evento duas vezes dá o mesmo resultado).
  - O Kafka está fora do ar quando o acadêmico sobe: o serviço sobe mesmo assim, e o consumidor tenta reconectar sozinho (é o comportamento padrão do `confluent-kafka`).
  - O front manda uma requisição de outra origem que não é a configurada: o gateway não manda o cabeçalho de CORS, e o navegador bloqueia.

## 6. Etapas de Implementação
1. **SQL:**
   - dividir `sql/school-core-service` em `sql/administrativo-service` e `sql/alunos-service`;
   - criar `sql/academico-service` (matrículas, notas, frequências e seed).
   - **Verificação:** rodar cada pasta num banco vazio sem erro.
2. **Administrativo:** renomear o `school-core-service` para `administrativo-service` e tirar alunos e matrículas. **Verificação:** os testes de professores, técnicos e turmas passam.
3. **Alunos:** criar o `alunos-service` com o código de aluno, mantendo o client do user-service e o evento `student.created`. **Verificação:** os testes de alunos passam.
4. **Acadêmico:** criar o `academico-service` com matrículas, notas, frequência e os clients HTTP. **Verificação:** os testes novos passam, incluindo o de serviço fora do ar (o client recebe erro de conexão e responde 503).
5. **Consumidor:**
   - criar o `app/consumidor.py` no acadêmico, com `tratar_evento` e o laço do Kafka ligado no `lifespan`;
   - publicar `student.deleted` (alunos), `class.deleted` (administrativo), `grade.recorded` e `attendance.recorded` (acadêmico);
   - documentar o `docs/eventos.md`.
   - **Verificação:** um teste chama `tratar_evento("student.deleted", ...)` e as matrículas somem.
6. **Infra:** Dockerfile de cada serviço, `gateway/nginx.conf` (rotas e CORS) e `compose.yaml` com tudo, incluindo o Kafka. **Verificação:** `docker compose up -d` sobe todos os containers, e `docker compose ps` mostra todos `healthy` ou `running`.
7. **Ponta a ponta com Kafka:** com o compose no ar, excluir um aluno matriculado pelo gateway. **Verificação:** as matrículas dele somem do `academico_db`, e o log do acadêmico mostra o evento recebido.
8. **Documentação:** atualizar o `services/README.md` (rotas pelo gateway, portas e variáveis) e o `README.md` (como subir). **Verificação:** seguir o README do zero funciona.

## 7. Critérios de Aceite
- [x] Dado o `compose` no ar, quando faço `POST /api/auth/login` em `localhost:8080` com `carla.tecnica@distrischool.test` / `Senha@123`, então recebo 200 com `access_token`.
- [x] Dado um token de ADMIN, quando faço `GET localhost:8080/api/alunos`, então recebo a lista dos 10 alunos do seed, vinda do `alunos-service`.
- [x] Dado um token de ADMIN, quando faço `GET localhost:8080/api/turmas`, então recebo as 2 turmas do seed, vindas do `administrativo-service`.
- [x] Dado um token de ADMIN, quando faço `POST /api/matriculas` com um aluno e uma turma que existem e que ainda não estão juntos, então recebo 201.
- [x] Dado o `alunos-service` parado (`docker stop`), quando faço `POST /api/matriculas`, então recebo 503 "Serviço de alunos indisponível" em poucos segundos.
- [x] Dado o `alunos-service` **e** o `administrativo-service` parados, quando um professor lança uma nota 8.5 numa matrícula que já existe (`POST /api/notas`), então recebo 201. Ou seja, o acadêmico funciona sozinho.
- [x] Dado `docker compose up --scale academico-service=3`, quando faço 6 requisições `GET /api/matriculas`, então o log mostra as 3 cópias atendendo.
- [x] Dado o banco do administrativo parado, quando faço `GET /api/alunos`, então continua respondendo 200. Ou seja, cada serviço tem o seu banco.
- [x] Dado um aluno com matrículas, quando chamo `tratar_evento("student.deleted", {"aluno_id": X})` no acadêmico, então as matrículas dele somem.
- [x] Dado o compose no ar com Kafka, quando faço `DELETE /api/alunos/X` (aluno com 2 matrículas), então em poucos segundos `GET /api/matriculas?aluno_id=X` volta vazio, e o log do acadêmico mostra "Evento student.deleted recebido".
- [x] Dado o acadêmico parado, quando excluo um aluno matriculado e depois subo o acadêmico de novo, então as matrículas dele somem assim que o serviço volta (o evento ficou esperando no Kafka).
- [x] Dada uma requisição `OPTIONS /api/alunos` com `Origin: http://localhost:3000`, então o gateway responde 204 com `Access-Control-Allow-Origin: http://localhost:3000`.
- [x] Dado `GET /api/alunos` com `Origin: http://localhost:3000` e um token válido, então a resposta traz `Access-Control-Allow-Origin: http://localhost:3000`.
- [x] O `docs/eventos.md` lista todos os eventos da seção 5, com quem publica, quem consome e um exemplo do conteúdo.

## 8. Testes e Validação
### Automatizados
> Em 04/11 os testes automatizados foram removidos a pedido do Sávio: o professor não pede arquivos de teste até a semana 4 (só teste de carga, na semana 7). Antes de remover, os 54 testes passaram. A validação ficou nos testes manuais pelo gateway (seção 7).
- [x] Testes do `administrativo-service` (os de professores, técnicos e turmas que já existem, sem os de aluno)
- [x] Testes do `alunos-service` (o `test_alunos.py`, que vem do `school-core`)
- [x] Testes novos do `academico-service`: matrícula (ok, 409, 404, serviço fora do ar → 503), nota (ok, 422), frequência (ok, 409), `tratar_evento`
- [x] Testes do `user-service` continuam passando
- [x] Rodar com `.venv/bin/pytest` em cada serviço, com o Postgres de teste na porta 55432
### Manual
- [x] **Ação:** `docker compose up -d` e `docker compose ps` → **Esperado:** gateway, 4 serviços e 4 bancos no ar
- [x] **Ação:** os critérios de aceite da seção 7, com curl contra `localhost:8080` → **Esperado:** os resultados descritos
- [x] **Ação:** abrir o Swagger de cada serviço (`localhost:8001` a `8004/docs`) → **Esperado:** cada um mostra só as suas rotas

## 9. Perguntas em Aberto
- As cinco perguntas da primeira versão (SQL, `compose.yaml`, Flyway, circuit breaker e rotas de matrícula; o circuit breaker depois saiu do escopo) foram respondidas e passaram para a seção 3.
- **Simplificar o `eventos.py` do Lucas?** Ele tem cerca de 80 linhas, com thread e lock. Uma versão de umas 15 linhas faria o mesmo. Isso fica para combinar com o Lucas e não bloqueia esta spec: os serviços novos copiam o que estiver na `main`.

## 10. Instruções para a IA
- Se algo não estiver coberto nesta spec, **pare e pergunte**.
- Entregue apenas os trechos alterados, com comentários explicativos.
- Ao final, envie um resumo com cada check marcado **+ evidência** (saída do comando/teste) e liste qualquer desvio da spec com o motivo.
