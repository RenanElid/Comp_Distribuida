# Eventos do DistriSchool

Este arquivo explica o que cada evento significa para os serviços: quem publica, quem consome e o que acontece quando ele chega.
Como subir o broker, listar tópicos e ler mensagens pelo terminal está em [kafka.md](kafka.md).

## Como funciona

- Cada evento é publicado num tópico do Kafka com o mesmo nome do evento (por exemplo, o tópico `student.deleted`).
- Quem publica usa a função `publicar_evento(topico, dados)` do arquivo `app/eventos.py` de cada serviço.
- O evento só é publicado **depois** que a mudança foi gravada no banco.
- Sem a variável `KAFKA_BOOTSTRAP_SERVERS`, o evento só aparece no log do serviço (é assim que os testes rodam).

Toda mensagem tem o mesmo formato (o "envelope"):

```json
{
  "tipo": "student.deleted",
  "ocorrido_em": "2026-11-03T21:06:20.512345+00:00",
  "dados": { "aluno_id": 3 }
}
```

- `tipo`: o nome do evento.
- `ocorrido_em`: data e hora em UTC.
- `dados`: o conteúdo do evento, que muda de um evento para outro (veja abaixo).

## Tabela dos eventos

| Evento | Quem publica | Quando | Quem consome | O que o consumidor faz |
|---|---|---|---|---|
| `user.logged` | user-service | Depois de um login válido | (auditoria, futuro) | — |
| `student.created` | alunos-service | Depois de cadastrar um aluno | (notificações, futuro) | — |
| `student.deleted` | alunos-service | Depois de excluir um aluno | academico-service | Apaga as matrículas do aluno (e as notas e frequências delas) |
| `class.deleted` | administrativo-service | Depois de excluir uma turma | academico-service | Apaga as matrículas da turma (e as notas e frequências delas) |
| `teacher.assigned` | administrativo-service | Depois de atribuir um professor a uma disciplina numa turma | (notificações, futuro) | — |
| `grade.recorded` | academico-service | Depois de lançar uma nota | (notificações, futuro) | — |
| `attendance.recorded` | academico-service | Depois de registrar uma frequência | (notificações aos pais, futuro) | — |

## O consumidor do acadêmico

- Fica em `services/academico-service/app/consumidor.py`.
- Lê os tópicos `student.deleted` e `class.deleted` com o grupo `academico-service`.
- Roda numa thread que o `main.py` liga quando o serviço sobe, só se `KAFKA_BOOTSTRAP_SERVERS` estiver configurado.
- Começa do evento mais antigo que ainda não leu (`auto.offset.reset = earliest`). Se o acadêmico estiver fora do ar quando um aluno for excluído, o evento fica esperando no Kafka e é processado assim que o serviço volta.
- Processar o mesmo evento duas vezes não dá erro: na segunda vez não há mais matrícula para apagar.
- Uma mensagem com JSON inválido, ou que dá erro ao ser tratada, é registrada no log, e o consumidor segue para a próxima.
- Cada evento recebido aparece no log assim: `Evento student.deleted recebido: {'aluno_id': 3}`.

## Exemplo de cada evento

Os campos de `dados` são os que o código publica hoje.

### user.logged

Publicado pelo user-service (`auth_service.py`).

```json
{
  "tipo": "user.logged",
  "ocorrido_em": "2026-11-03T21:05:58.104213+00:00",
  "dados": { "usuario_id": 1, "perfil": "ADMIN" }
}
```

### student.created

Publicado pelo alunos-service (`aluno_service.py`).

```json
{
  "tipo": "student.created",
  "ocorrido_em": "2026-11-03T21:10:02.731904+00:00",
  "dados": { "aluno_id": 11, "usuario_id": 17, "nome": "Aluno Novo" }
}
```

### student.deleted

Publicado pelo alunos-service (`aluno_service.py`). Consumido pelo academico-service.

```json
{
  "tipo": "student.deleted",
  "ocorrido_em": "2026-11-03T21:06:20.512345+00:00",
  "dados": { "aluno_id": 3 }
}
```

### class.deleted

Publicado pelo administrativo-service (`turma_service.py`). Consumido pelo academico-service.

```json
{
  "tipo": "class.deleted",
  "ocorrido_em": "2026-11-03T21:12:45.019876+00:00",
  "dados": { "turma_id": 2 }
}
```

### teacher.assigned

Publicado pelo administrativo-service (`atribuicao_service.py`).

```json
{
  "tipo": "teacher.assigned",
  "ocorrido_em": "2026-11-03T21:14:10.402981+00:00",
  "dados": { "professor_id": 2, "turma_id": 1, "disciplina_id": 3 }
}
```

### grade.recorded

Publicado pelo academico-service (`nota_service.py`).

```json
{
  "tipo": "grade.recorded",
  "ocorrido_em": "2026-11-03T21:15:33.887120+00:00",
  "dados": { "nota_id": 1, "matricula_id": 4, "disciplina_id": 1, "descricao": "AV1", "valor": 8.5 }
}
```

### attendance.recorded

Publicado pelo academico-service (`frequencia_service.py`).

```json
{
  "tipo": "attendance.recorded",
  "ocorrido_em": "2026-11-03T21:16:05.220347+00:00",
  "dados": { "frequencia_id": 1, "matricula_id": 4, "data": "2026-11-03", "situacao": "PRESENTE" }
}
```
