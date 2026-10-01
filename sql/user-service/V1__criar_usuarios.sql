-- user_db: application users and their access profile.

CREATE TABLE usuarios (
    id                BIGSERIAL    PRIMARY KEY,
    email             VARCHAR(255) NOT NULL UNIQUE,
    senha_hash        VARCHAR(100) NOT NULL,
    perfil            VARCHAR(20)  NOT NULL,
    email_verificado  BOOLEAN      NOT NULL DEFAULT FALSE,
    ativo             BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_usuarios_perfil CHECK (perfil IN ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'))
);

COMMENT ON TABLE  usuarios                  IS 'Application users (login accounts).';
COMMENT ON COLUMN usuarios.senha_hash       IS 'BCrypt hash of the password, never the plain text.';
COMMENT ON COLUMN usuarios.perfil           IS 'Access profile: ADMIN, TEACHER, STUDENT or PARENT.';
COMMENT ON COLUMN usuarios.email_verificado IS 'TRUE after the user confirms the email link.';
COMMENT ON COLUMN usuarios.ativo            IS 'FALSE means the account is disabled (soft delete).';
