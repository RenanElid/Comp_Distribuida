-- school_db: administrative technicians.

CREATE TABLE tecnicos_administrativos (
    id          BIGSERIAL    PRIMARY KEY,
    usuario_id  BIGINT       NOT NULL UNIQUE,
    nome        VARCHAR(150) NOT NULL,
    cargo       VARCHAR(100),
    contato     VARCHAR(100)
);

COMMENT ON TABLE  tecnicos_administrativos            IS 'Administrative staff of the school.';
COMMENT ON COLUMN tecnicos_administrativos.usuario_id IS 'Id of the user in user_db. Plain number, NO foreign key (different database).';
