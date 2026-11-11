-- academico_db: a student can be enrolled in only one class per school year.
-- ano_letivo is copied from the class (administrativo_db) when the enrollment is created,
-- because there is no foreign key between databases to look it up.

ALTER TABLE matriculas ADD COLUMN ano_letivo INTEGER;

-- Backfill only the seed rows: classes 1 and 2 of the administrativo-service seed are both from 2026.
-- Rows of other classes stay NULL and are not covered by the rule below.
UPDATE matriculas SET ano_letivo = 2026 WHERE ano_letivo IS NULL AND turma_id IN (1, 2);

-- NULLs are treated as distinct by PostgreSQL, so old rows without ano_letivo never conflict.
ALTER TABLE matriculas
    ADD CONSTRAINT uq_matriculas_aluno_ano_letivo UNIQUE (aluno_id, ano_letivo);

COMMENT ON COLUMN matriculas.ano_letivo IS 'School year of the class, copied from administrativo_db. Ensures one class per student per year.';
