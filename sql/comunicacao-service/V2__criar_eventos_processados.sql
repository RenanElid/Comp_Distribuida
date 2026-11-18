-- comunicacao_db: events already handled by the consumer.
-- Kafka may deliver the same event more than once; the consumer inserts the event id here
-- in the same transaction as the notification, and skips the event if the id already exists.

CREATE TABLE eventos_processados (
    evento_id      VARCHAR(100) PRIMARY KEY,
    topico         VARCHAR(100) NOT NULL,
    processado_em  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE  eventos_processados           IS 'Idempotency control: one row per event already turned into notifications.';
COMMENT ON COLUMN eventos_processados.evento_id IS 'Unique id carried by each event, set by the producer.';
