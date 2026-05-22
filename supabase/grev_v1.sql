-- Inserir planos padrão
INSERT INTO plans (nome, descricao, preco_mensal, max_obras, ativo)
VALUES
  ('Gratuito', 'Ideal para começar', 0, 1, true),
  ('Pro', 'Para construtoras em crescimento', 350, -1, true)
ON CONFLICT DO NOTHING;

-- Tabela de documentos legais
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL UNIQUE,
  conteudo TEXT NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superuser can manage legal docs" ON legal_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superuser = true)
  );
CREATE POLICY "Public can read legal docs" ON legal_documents
  FOR SELECT USING (true);

-- Tabela de auditoria admin
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id),
  admin_email TEXT,
  acao TEXT NOT NULL,
  detalhes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superuser can manage audit log" ON admin_audit_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superuser = true)
  );

-- Inserir conteúdo inicial da política de privacidade
INSERT INTO legal_documents (tipo, conteudo)
VALUES ('politica-privacidade', 'Política de Privacidade do Grev — em atualização.')
ON CONFLICT (tipo) DO NOTHING;
