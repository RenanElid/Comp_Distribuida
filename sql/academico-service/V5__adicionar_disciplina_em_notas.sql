ALTER TABLE notas ADD COLUMN disciplina_id BIGINT;

CREATE INDEX idx_notas_disciplina_id ON notas (disciplina_id);

COMMENT ON COLUMN notas.disciplina_id IS 'Id of the subject in administrativo_db. Plain number, NO foreign key (different database).';
