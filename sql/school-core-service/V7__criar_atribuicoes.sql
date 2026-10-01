-- school_db: assignment of a teacher to a subject in a class.

CREATE TABLE atribuicoes (
    id            BIGSERIAL PRIMARY KEY,
    turma_id      BIGINT    NOT NULL REFERENCES turmas (id)       ON DELETE CASCADE,
    disciplina_id BIGINT    NOT NULL REFERENCES disciplinas (id)  ON DELETE CASCADE,
    professor_id  BIGINT    NOT NULL REFERENCES professores (id)  ON DELETE RESTRICT,
    CONSTRAINT uq_atribuicoes_turma_disciplina UNIQUE (turma_id, disciplina_id)
);

CREATE INDEX idx_atribuicoes_professor_id ON atribuicoes (professor_id);

COMMENT ON TABLE atribuicoes IS 'Which teacher teaches which subject in which class (one teacher per subject per class).';
