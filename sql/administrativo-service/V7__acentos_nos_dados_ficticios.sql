-- administrativo_db: puts back the accents that the V6 seed left out (the names show up on screens,
-- PDFs and notifications). Each UPDATE only touches the exact seed value, so a name already changed
-- through the system is left as it is. V6 is not edited because Flyway checks its checksum.

UPDATE disciplinas SET nome = 'Matemática'        WHERE nome = 'Matematica';
UPDATE disciplinas SET nome = 'Língua Portuguesa' WHERE nome = 'Lingua Portuguesa';
UPDATE disciplinas SET nome = 'História'          WHERE nome = 'Historia';

UPDATE professores SET qualificacao = 'Licenciatura em Matemática, Mestrado em Educação'
    WHERE qualificacao = 'Licenciatura em Matematica, Mestrado em Educacao';
UPDATE professores SET qualificacao = 'Licenciatura em Letras, Especialização em Redação'
    WHERE qualificacao = 'Licenciatura em Letras, Especializacao em Redacao';
UPDATE professores SET qualificacao = 'Licenciatura em História'
    WHERE qualificacao = 'Licenciatura em Historia';

UPDATE tecnicos_administrativos SET cargo = 'Secretária Escolar' WHERE cargo = 'Secretaria Escolar';
