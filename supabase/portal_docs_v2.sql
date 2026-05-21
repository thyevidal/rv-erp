-- Portal docs v2: adiciona nome_tipo para rastrear qual "slot" de documento foi enviado
ALTER TABLE ac_documentos ADD COLUMN IF NOT EXISTS nome_tipo TEXT;

-- Índice para buscas por tipo de documento
CREATE INDEX IF NOT EXISTS idx_ac_documentos_nome_tipo ON ac_documentos(nome_tipo);
