-- user_db: tokens used by the password recovery flow.

CREATE TABLE tokens_recuperacao (
    id          BIGSERIAL    PRIMARY KEY,
    usuario_id  BIGINT       NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expira_em   TIMESTAMPTZ  NOT NULL,
    usado       BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_tokens_recuperacao_usuario_id ON tokens_recuperacao (usuario_id);

COMMENT ON TABLE  tokens_recuperacao           IS 'Single-use tokens for password recovery.';
COMMENT ON COLUMN tokens_recuperacao.expira_em IS 'Moment after which the token is no longer valid.';
COMMENT ON COLUMN tokens_recuperacao.usado     IS 'TRUE once the token has been consumed.';
