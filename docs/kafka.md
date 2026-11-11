# Kafka

O `compose.yaml` sobe um broker Apache Kafka 4.3.2 em modo KRaft, sem ZooKeeper. Ele usa um volume para manter as mensagens após `docker compose down`. A porta publicada fica acessível apenas no próprio computador.

## Iniciar e conferir

Na raiz do repositório, com o Docker Desktop ativo:

```powershell
docker compose up -d kafka
docker compose ps kafka
```

O health check lista os tópicos pelo mesmo endereço usado pelos serviços no Docker, `kafka:19092`. Os serviços sobem em paralelo com o Kafka, e suas rotas HTTP ficam disponíveis mesmo se o broker estiver indisponível. Para disparar eventos pela API, suba a stack com `docker compose up -d --build` e confirme que o Kafka está `healthy`. O Compose também executa as migrations dos bancos.

Os `.env.example` dos serviços já usam `KAFKA_BOOTSTRAP_SERVERS=kafka:19092` para rodar em Docker. Se executar um serviço direto no Windows, use `localhost:9092` ou a porta configurada em `KAFKA_PORT` no `.env` da raiz. Sem `KAFKA_BOOTSTRAP_SERVERS`, os eventos ficam no log.

## Eventos

Os produtores publicam mensagens JSON em tópicos com o nome do evento. Os tópicos são criados sob demanda. Veja os produtores, consumidores e formatos em [eventos.md](eventos.md). Para listar os tópicos:

```powershell
docker compose exec -T kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:19092 --list
```

Faça um login válido pelo gateway para gerar um `user.logged`. Para ler uma mensagem já publicada nesse tópico:

```powershell
docker compose exec -T kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server kafka:19092 --topic user.logged --from-beginning --max-messages 1 --timeout-ms 10000
```

O envio é assíncrono. A requisição HTTP não espera a confirmação do Kafka. Os produtores registram falhas de entrega no log. Se o broker ficar fora do ar por tempo suficiente, um evento pode se perder, pois a gravação no banco e a publicação são operações separadas.
