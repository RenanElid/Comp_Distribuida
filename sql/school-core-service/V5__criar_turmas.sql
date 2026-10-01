-- school_db: classes (groups of students in a school year).

CREATE TABLE turmas (
    id           BIGSERIAL    PRIMARY KEY,
    nome         VARCHAR(100) NOT NULL,
    ano_letivo   INTEGER      NOT NULL,
    turno        VARCHAR(10)  NOT NULL,
    CONSTRAINT ck_turmas_turno CHECK (turno IN ('MANHA', 'TARDE', 'NOITE'))
);

COMMENT ON TABLE  turmas            IS 'Classes of a given school year.';
COMMENT ON COLUMN turmas.ano_letivo IS 'School year, e.g. 2026.';
COMMENT ON COLUMN turmas.turno      IS 'Shift: MANHA (morning), TARDE (afternoon) or NOITE (night).';
