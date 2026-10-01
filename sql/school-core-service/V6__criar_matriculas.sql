-- school_db: enrollment of a student in a class.

CREATE TABLE matriculas (
    id        BIGSERIAL PRIMARY KEY,
    aluno_id  BIGINT    NOT NULL REFERENCES alunos (id) ON DELETE CASCADE,
    turma_id  BIGINT    NOT NULL REFERENCES turmas (id) ON DELETE CASCADE,
    CONSTRAINT uq_matriculas_aluno_turma UNIQUE (aluno_id, turma_id)
);

CREATE INDEX idx_matriculas_turma_id ON matriculas (turma_id);

COMMENT ON TABLE matriculas IS 'Links students to classes. A student can be enrolled only once per class.';
