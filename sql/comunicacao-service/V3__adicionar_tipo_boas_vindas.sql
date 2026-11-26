-- comunicacao_db: new notification type BOAS_VINDAS, created from the student.created event
-- (welcome message for the student who was just registered).

ALTER TABLE notificacoes DROP CONSTRAINT ck_notificacoes_tipo;
ALTER TABLE notificacoes
    ADD CONSTRAINT ck_notificacoes_tipo
    CHECK (tipo IN ('NOTA_LANCADA', 'FREQUENCIA_REGISTRADA', 'PROFESSOR_ATRIBUIDO', 'BOAS_VINDAS'));

COMMENT ON COLUMN notificacoes.tipo IS 'NOTA_LANCADA, FREQUENCIA_REGISTRADA, PROFESSOR_ATRIBUIDO or BOAS_VINDAS.';
