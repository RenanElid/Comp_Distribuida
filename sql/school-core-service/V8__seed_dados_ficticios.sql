-- school_db seed: fictional data for development.
-- usuario_id values match the fixed IDs of the user-service seed (V3__seed_usuarios.sql):
--   1-2 technicians, 3-5 teachers, 6-15 students.

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

INSERT INTO professores (usuario_id, nome, qualificacao, contato) VALUES
    (3, 'Marcos Oliveira', 'Licenciatura em Matematica, Mestrado em Educacao',  '(85) 98801-0001'),
    (4, 'Helena Duarte',   'Licenciatura em Letras, Especializacao em Redacao',  '(85) 98801-0002'),
    (5, 'Ricardo Nunes',   'Licenciatura em Historia',                           '(85) 98801-0003');

INSERT INTO tecnicos_administrativos (usuario_id, nome, cargo, contato) VALUES
    (1, 'Carla Menezes', 'Secretaria Escolar',      '(85) 97701-0001'),
    (2, 'Paulo Vieira',  'Coordenador Administrativo', '(85) 97701-0002');

INSERT INTO disciplinas (nome, carga_horaria) VALUES
    ('Matematica',  120),
    ('Lingua Portuguesa', 120),
    ('Historia',     80);

INSERT INTO turmas (nome, ano_letivo, turno) VALUES
    ('9o Ano A', 2026, 'MANHA'),
    ('9o Ano B', 2026, 'TARDE');

-- Ids below rely on the sequences starting at 1 on an empty database.
-- Students 1-5 in class 1, students 6-10 in class 2.
INSERT INTO matriculas (aluno_id, turma_id) VALUES
    (1, 1), (2, 1), (3, 1), (4, 1), (5, 1),
    (6, 2), (7, 2), (8, 2), (9, 2), (10, 2);

INSERT INTO atribuicoes (turma_id, disciplina_id, professor_id) VALUES
    (1, 1, 1), (1, 2, 2), (1, 3, 3),
    (2, 1, 1), (2, 2, 2), (2, 3, 3);
