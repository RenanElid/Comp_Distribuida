-- academico_db: enrollment of a student in a class.

CREATE TABLE matriculas (
    id        BIGSERIAL PRIMARY KEY,
    aluno_id  BIGINT    NOT NULL,
    turma_id  BIGINT    NOT NULL,
    CONSTRAINT uq_matriculas_aluno_turma UNIQUE (aluno_id, turma_id)
);

-- The UNIQUE (aluno_id, turma_id) index already covers lookups by aluno_id.
CREATE INDEX idx_matriculas_turma_id ON matriculas (turma_id);

COMMENT ON TABLE  matriculas          IS 'Links students to classes. A student can be enrolled only once per class.';
COMMENT ON COLUMN matriculas.aluno_id IS 'Id of the student in alunos_db. Plain number, NO foreign key (different database).';
COMMENT ON COLUMN matriculas.turma_id IS 'Id of the class in administrativo_db. Plain number, NO foreign key (different database).';
