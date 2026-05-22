-- Features flag por plano
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';

-- Atualizar planos existentes com features padrão
UPDATE plans SET features = '{
  "banco_insumos": false,
  "agenda": false,
  "financeiro_org": false,
  "estoque": false,
  "aquisicao_construcao": false,
  "relatorio_pdf": false,
  "multiplos_membros": false
}' WHERE preco_mensal = 0 OR nome ILIKE '%gratu%';

UPDATE plans SET features = '{
  "banco_insumos": true,
  "agenda": true,
  "financeiro_org": true,
  "estoque": true,
  "aquisicao_construcao": true,
  "relatorio_pdf": true,
  "multiplos_membros": true
}' WHERE preco_mensal > 0 OR nome ILIKE '%pro%';

-- Promoções por plano
CREATE TABLE IF NOT EXISTS plan_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  desconto_pct NUMERIC(5,2) NOT NULL,
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE plan_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superusers manage promotions" ON plan_promotions
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superuser = true));
