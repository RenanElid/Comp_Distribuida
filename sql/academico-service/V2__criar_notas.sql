-- academico_db: grades of an enrollment.

CREATE TABLE notas (
    id            BIGSERIAL    PRIMARY KEY,
    matricula_id  BIGINT       NOT NULL REFERENCES matriculas (id) ON DELETE CASCADE,
    descricao     VARCHAR(50)  NOT NULL,
    valor         NUMERIC(4,2) NOT NULL,
    CONSTRAINT ck_notas_valor CHECK (valor >= 0 AND valor <= 10)
);

CREATE INDEX idx_notas_matricula_id ON notas (matricula_id);

COMMENT ON TABLE  notas           IS 'Grades given to a student in a class (through the enrollment).';
COMMENT ON COLUMN notas.descricao IS 'Which assessment the grade is for, e.g. AV1.';
COMMENT ON COLUMN notas.valor     IS 'Grade from 0 to 10.';
