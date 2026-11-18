-- alunos_db seed: links Ana Souza (matricula 2026001) to Maria (user 16, PARENT, from the user-service seed).
-- Uses the matricula instead of the id to make the target explicit.

UPDATE alunos SET responsavel_usuario_id = 16 WHERE matricula = '2026001';
