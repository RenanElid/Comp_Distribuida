-- administrativo_db seed: fictional data for development.
-- usuario_id values match the fixed IDs of the user-service seed (V3__seed_usuarios.sql):
--   1-2 technicians, 3-5 teachers.
-- Class ids (turmas 1 and 2) are used as turma_id in the academico-service seed.

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
INSERT INTO atribuicoes (turma_id, disciplina_id, professor_id) VALUES
    (1, 1, 1), (1, 2, 2), (1, 3, 3),
    (2, 1, 1), (2, 2, 2), (2, 3, 3);
