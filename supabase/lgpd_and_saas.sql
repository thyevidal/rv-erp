-- ============================================================
-- Migration: LGPD + SaaS (plans, subscriptions, coupons)
-- Rodar no Supabase SQL Editor
-- ============================================================

-- 1. Adiciona campos LGPD e superuser na tabela profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS lgpd_aceito BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lgpd_aceito_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_superuser BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Planos
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_mensal NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_obras INTEGER NOT NULL DEFAULT 1, -- -1 = ilimitado
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plano Free padrão
INSERT INTO plans (nome, descricao, preco_mensal, max_obras, ativo)
VALUES ('Free', 'Plano gratuito com 1 obra ativa.', 0, 1, TRUE)
ON CONFLICT DO NOTHING;

-- 3. Assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'ATIVA' CHECK (status IN ('ATIVA','CANCELADA','TRIAL')),
  inicio TIMESTAMPTZ DEFAULT NOW(),
  fim TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Cupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL UNIQUE,
  desconto_pct NUMERIC(5,2),
  desconto_fixo NUMERIC(10,2),
  max_usos INTEGER,
  usos INTEGER NOT NULL DEFAULT 0,
  valido_ate TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS para plans (leitura pública autenticada, escrita só superuser)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans_read" ON plans;
CREATE POLICY "plans_read" ON plans FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "plans_write" ON plans;
CREATE POLICY "plans_write" ON plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superuser = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superuser = TRUE));

-- 6. RLS para subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_org" ON subscriptions;
CREATE POLICY "subscriptions_org" ON subscriptions FOR SELECT TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superuser = TRUE)
  );
DROP POLICY IF EXISTS "subscriptions_write_super" ON subscriptions;
CREATE POLICY "subscriptions_write_super" ON subscriptions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superuser = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superuser = TRUE));

-- 7. RLS para coupons (só superuser)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coupons_super" ON coupons;
CREATE POLICY "coupons_super" ON coupons FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superuser = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superuser = TRUE));

-- 8. Associar orgs existentes ao plano Free automaticamente
INSERT INTO subscriptions (organization_id, plan_id, status)
SELECT o.id, p.id, 'ATIVA'
FROM organizations o
CROSS JOIN plans p
WHERE p.nome = 'Free'
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.organization_id = o.id
  );
