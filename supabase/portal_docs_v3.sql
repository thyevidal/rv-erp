-- Portal docs v3: adiciona visivel_correspondente para controle de visibilidade
ALTER TABLE ac_documentos ADD COLUMN IF NOT EXISTS visivel_correspondente BOOLEAN NOT NULL DEFAULT FALSE;

-- Índice para buscas por visibilidade
CREATE INDEX IF NOT EXISTS idx_ac_documentos_visivel_correspondente ON ac_documentos(visivel_correspondente);
