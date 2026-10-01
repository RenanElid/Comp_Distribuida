-- school_db: subjects.

CREATE TABLE disciplinas (
    id            BIGSERIAL    PRIMARY KEY,
    nome          VARCHAR(100) NOT NULL,
    carga_horaria INTEGER      NOT NULL CHECK (carga_horaria > 0)
);

COMMENT ON TABLE  disciplinas               IS 'Subjects taught at the school.';
COMMENT ON COLUMN disciplinas.carga_horaria IS 'Total workload in hours.';
