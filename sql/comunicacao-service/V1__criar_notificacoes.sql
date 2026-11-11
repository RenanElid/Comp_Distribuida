-- comunicacao_db: notifications shown to each user.

CREATE TABLE notificacoes (
    id          BIGSERIAL    PRIMARY KEY,
    usuario_id  BIGINT       NOT NULL,
    tipo        VARCHAR(30)  NOT NULL,
    mensagem    VARCHAR(255) NOT NULL,
    lida        BOOLEAN      NOT NULL DEFAULT FALSE,
    criada_em   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_notificacoes_tipo CHECK (tipo IN ('NOTA_LANCADA', 'FREQUENCIA_REGISTRADA', 'PROFESSOR_ATRIBUIDO'))
);

-- GET /notificacoes always filters by the logged user and orders by newest first.
CREATE INDEX idx_notificacoes_usuario_criada_em ON notificacoes (usuario_id, criada_em DESC);

COMMENT ON TABLE  notificacoes            IS 'Notifications created from Kafka events. Each user sees only their own.';
COMMENT ON COLUMN notificacoes.usuario_id IS 'Id of the recipient in user_db, sent in the event by the producer. Plain number, NO foreign key (different database).';
COMMENT ON COLUMN notificacoes.tipo       IS 'NOTA_LANCADA, FREQUENCIA_REGISTRADA or PROFESSOR_ATRIBUIDO.';
COMMENT ON COLUMN notificacoes.lida       IS 'FALSE until the user marks it as read (PATCH /notificacoes/{id}/lida).';
