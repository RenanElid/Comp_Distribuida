-- school_db: teachers.

CREATE TABLE professores (
    id            BIGSERIAL    PRIMARY KEY,
    usuario_id    BIGINT       NOT NULL UNIQUE,
    nome          VARCHAR(150) NOT NULL,
    qualificacao  VARCHAR(255),
    contato       VARCHAR(100)
);

COMMENT ON TABLE  professores            IS 'Teachers of the school.';
COMMENT ON COLUMN professores.usuario_id IS 'Id of the user in user_db. Plain number, NO foreign key (different database).';
COMMENT ON COLUMN professores.qualificacao IS 'Academic qualification, e.g. degree or specialization.';
