# Kafka (semanas 3-4)

O `compose.yaml` sobe um broker Apache Kafka 4.3.2 em modo KRaft, sem ZooKeeper. Ele usa um volume para manter as mensagens após `docker compose down`. A porta publicada fica acessível apenas no próprio computador.

## Iniciar e conferir

Na raiz do repositório, com o Docker Desktop ativo:

```powershell
docker compose up -d kafka
docker compose ps kafka
```

Espere o status `healthy`. A partir do Windows, os serviços usam `localhost:9092`. Se rodarem em contêineres na mesma rede do Compose, usam `kafka:19092`. Se a porta 9092 já estiver ocupada, configure `KAFKA_PORT` no `.env` da raiz e use o mesmo valor nas configurações locais dos serviços.

Para disparar os eventos pelos endpoints FastAPI, suba também o banco com `docker compose up -d db` e aplique as migrations descritas em [sql/README.md](../sql/README.md).

Os exemplos em `services/user-service/.env.example` e `services/school-core-service/.env.example` incluem `KAFKA_BOOTSTRAP_SERVERS=localhost:9092`. Cada serviço precisa dessa variável para publicar. Sem ela, os eventos continuam apenas no log.

## Eventos

| Tópico | Quando é publicado | Serviço |
| --- | --- | --- |
| `user.logged` | Após login válido | `user-service` |
| `student.created` | Após cadastrar aluno | `school-core-service` |
| `teacher.assigned` | Após atribuir professor a uma turma | `school-core-service` |

Cada mensagem é JSON com `tipo`, `ocorrido_em` (data e hora UTC) e `dados` (os identificadores e informações do evento). Os tópicos são criados quando o primeiro evento de cada tipo é publicado. Para listar os tópicos:

```powershell
docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:19092 --list
```

Para visualizar mensagens já publicadas no tópico `student.created`:

```powershell
docker compose exec kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server kafka:19092 --topic student.created --from-beginning --timeout-ms 5000
```

O envio é assíncrono: a requisição HTTP não espera a confirmação do Kafka. Falhas de entrega são registradas no log; se o broker ficar fora do ar por tempo suficiente, o evento pode se perder. O consumo para notificações e uma garantia de entrega ligada à transação do banco ficam para uma etapa posterior.
