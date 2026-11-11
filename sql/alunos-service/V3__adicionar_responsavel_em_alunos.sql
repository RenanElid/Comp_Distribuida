-- alunos_db: link each student to the user (PARENT) responsible for them.

ALTER TABLE alunos ADD COLUMN responsavel_usuario_id BIGINT;

CREATE INDEX idx_alunos_responsavel_usuario_id ON alunos (responsavel_usuario_id);

COMMENT ON COLUMN alunos.responsavel_usuario_id IS 'Id of the PARENT user in user_db responsible for the student. Optional. Plain number, NO foreign key (different database).';
