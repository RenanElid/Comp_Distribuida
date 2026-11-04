-- academico_db seed: fictional enrollments for development.
-- aluno_id values match the students of the alunos-service seed (ids 1-10)
-- and turma_id values match the classes of the administrativo-service seed (ids 1-2).
-- Students 1-5 in class 1, students 6-10 in class 2.

INSERT INTO matriculas (aluno_id, turma_id) VALUES
    (1, 1), (2, 1), (3, 1), (4, 1), (5, 1),
    (6, 2), (7, 2), (8, 2), (9, 2), (10, 2);
