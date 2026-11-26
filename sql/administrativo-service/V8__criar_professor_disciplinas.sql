-- administrativo_db: subjects each teacher is able to teach. An assignment (atribuicoes) is only
-- accepted when the teacher teaches that subject, so a Math teacher cannot be put in a History slot.

CREATE TABLE professor_disciplinas (
    professor_id  BIGINT NOT NULL REFERENCES professores (id) ON DELETE CASCADE,
    disciplina_id BIGINT NOT NULL REFERENCES disciplinas (id) ON DELETE CASCADE,
    PRIMARY KEY (professor_id, disciplina_id)
);

CREATE INDEX idx_professor_disciplinas_disciplina_id ON professor_disciplinas (disciplina_id);

-- Backfill: whoever already teaches a subject in some class teaches that subject.
-- Uses the existing assignments instead of fixed ids, so it also fits databases that are not the seed.
INSERT INTO professor_disciplinas (professor_id, disciplina_id)
SELECT DISTINCT professor_id, disciplina_id FROM atribuicoes;

COMMENT ON TABLE professor_disciplinas IS 'Subjects a teacher can teach. Assignments are validated against it.';
