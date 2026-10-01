-- user_db seed: fictional users for development.
-- All accounts use the same test password (see sql/README.md).
-- IDs are fixed on purpose: school_db stores them in usuario_id (no FK across databases).
--   1-2   ADMIN   (administrative technicians)
--   3-5   TEACHER (teachers)
--   6-15  STUDENT (students)
--   16    PARENT

INSERT INTO usuarios (id, email, senha_hash, perfil, email_verificado, ativo) VALUES
    (1,  'carla.tecnica@distrischool.test',   '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'ADMIN',   TRUE,  TRUE),
    (2,  'paulo.tecnico@distrischool.test',   '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'ADMIN',   TRUE,  TRUE),
    (3,  'marcos.prof@distrischool.test',     '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'TEACHER', TRUE,  TRUE),
    (4,  'helena.prof@distrischool.test',     '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'TEACHER', TRUE,  TRUE),
    (5,  'ricardo.prof@distrischool.test',    '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'TEACHER', FALSE, TRUE),
    (6,  'ana.souza@distrischool.test',       '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'STUDENT', TRUE,  TRUE),
    (7,  'bruno.lima@distrischool.test',      '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'STUDENT', TRUE,  TRUE),
    (8,  'carlos.mendes@distrischool.test',   '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'STUDENT', TRUE,  TRUE),
    (9,  'daniela.rocha@distrischool.test',   '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'STUDENT', TRUE,  TRUE),
    (10, 'eduardo.alves@distrischool.test',   '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'STUDENT', FALSE, TRUE),
    (11, 'fernanda.costa@distrischool.test',  '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'STUDENT', TRUE,  TRUE),
    (12, 'gabriel.pinto@distrischool.test',   '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'STUDENT', TRUE,  TRUE),
    (13, 'heloisa.martins@distrischool.test', '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'STUDENT', TRUE,  TRUE),
    (14, 'igor.ferreira@distrischool.test',   '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'STUDENT', TRUE,  FALSE),
    (15, 'julia.barros@distrischool.test',    '$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'STUDENT', TRUE,  TRUE),
    (16, 'maria.responsavel@distrischool.test','$2a$10$spzl3Q0sWVrk/7Mme/XM7.QZuzpVhVNM9hhZi8m0RHUpd7GqOWxoa', 'PARENT',  TRUE,  TRUE);

-- Move the sequence past the fixed IDs so new inserts do not collide.
SELECT setval(pg_get_serial_sequence('usuarios', 'id'), (SELECT MAX(id) FROM usuarios));
