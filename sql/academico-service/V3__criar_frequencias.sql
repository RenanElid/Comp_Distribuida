-- academico_db: attendance of an enrollment on a given day.

CREATE TABLE frequencias (
    id            BIGSERIAL   PRIMARY KEY,
    matricula_id  BIGINT      NOT NULL REFERENCES matriculas (id) ON DELETE CASCADE,
    data          DATE        NOT NULL,
    situacao      VARCHAR(10) NOT NULL,
    CONSTRAINT ck_frequencias_situacao CHECK (situacao IN ('PRESENTE', 'FALTA', 'ATRASO')),
    CONSTRAINT uq_frequencias_matricula_data UNIQUE (matricula_id, data)
);

COMMENT ON TABLE  frequencias          IS 'Attendance record of a student in a class. One record per enrollment per day.';
COMMENT ON COLUMN frequencias.situacao IS 'PRESENTE (present), FALTA (absent) or ATRASO (late).';
