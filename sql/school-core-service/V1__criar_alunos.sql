-- school_db: students.

CREATE TABLE alunos (
    id               BIGSERIAL    PRIMARY KEY,
    usuario_id       BIGINT       NOT NULL UNIQUE,
    matricula        VARCHAR(20)  NOT NULL UNIQUE,
    nome             VARCHAR(150) NOT NULL,
    data_nascimento  DATE         NOT NULL,
    endereco         VARCHAR(255),
    contato          VARCHAR(100)
);

-- UNIQUE on matricula already creates an index; this one makes the lookup intent explicit
-- and is kept separate so it can be tuned independently if needed.
CREATE INDEX idx_alunos_matricula ON alunos (matricula);
CREATE INDEX idx_alunos_nome      ON alunos (nome);

COMMENT ON TABLE  alunos            IS 'Students enrolled in the school.';
COMMENT ON COLUMN alunos.usuario_id IS 'Id of the user in user_db. Plain number, NO foreign key (different database).';
COMMENT ON COLUMN alunos.matricula  IS 'Student registration number, unique across the school.';
