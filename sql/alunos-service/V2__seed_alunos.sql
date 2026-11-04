-- alunos_db seed: fictional students for development.
-- usuario_id values match the fixed IDs of the user-service seed (V3__seed_usuarios.sql):
--   6-15 students.
-- Student ids (1-10, from the sequence on an empty database) are used as aluno_id
-- in the academico-service seed.

INSERT INTO alunos (usuario_id, matricula, nome, data_nascimento, endereco, contato) VALUES
    (6,  '2026001', 'Ana Souza',       '2010-03-14', 'Rua das Flores, 120 - Fortaleza/CE',     '(85) 99901-0001'),
    (7,  '2026002', 'Bruno Lima',      '2010-07-22', 'Av. Beira Mar, 455 - Fortaleza/CE',      '(85) 99901-0002'),
    (8,  '2026003', 'Carlos Mendes',   '2009-11-05', 'Rua do Sol, 78 - Fortaleza/CE',          '(85) 99901-0003'),
    (9,  '2026004', 'Daniela Rocha',   '2010-01-30', 'Rua Padre Mororó, 310 - Fortaleza/CE',   '(85) 99901-0004'),
    (10, '2026005', 'Eduardo Alves',   '2009-09-18', 'Av. Washington Soares, 900 - Fortaleza/CE', '(85) 99901-0005'),
    (11, '2026006', 'Fernanda Costa',  '2010-05-09', 'Rua Silva Jatahy, 60 - Fortaleza/CE',    '(85) 99901-0006'),
    (12, '2026007', 'Gabriel Pinto',   '2009-12-25', 'Rua Barão de Studart, 1500 - Fortaleza/CE', '(85) 99901-0007'),
    (13, '2026008', 'Heloisa Martins', '2010-08-02', 'Av. Dom Luís, 700 - Fortaleza/CE',       '(85) 99901-0008'),
    (14, '2026009', 'Igor Ferreira',   '2010-02-17', 'Rua Ana Bilhar, 250 - Fortaleza/CE',     '(85) 99901-0009'),
    (15, '2026010', 'Julia Barros',    '2009-10-11', 'Rua Tibúrcio Cavalcante, 33 - Fortaleza/CE', '(85) 99901-0010');
