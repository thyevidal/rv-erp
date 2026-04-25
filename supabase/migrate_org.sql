-- ============================================================
-- ERP Rezende & Vidal — Módulo de Organização (Multi-tenant)
-- Execute este script no SQL Editor do painel do Supabase
-- ============================================================

-- 1. Criar Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criar Tabela: organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Criar Tabela: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT,
  role user_role NOT NULL DEFAULT 'member',
  can_view_finance BOOLEAN NOT NULL DEFAULT false,
  can_delete_records BOOLEAN NOT NULL DEFAULT false,
  can_edit_inventory BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_org_id ON profiles(organization_id);

-- 4. Adicionar organization_id nas tabelas existentes
ALTER TABLE obras ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE insumos_base ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE estoque_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 5. Mapear Índices
CREATE INDEX IF NOT EXISTS idx_obras_org_id ON obras(organization_id);
CREATE INDEX IF NOT EXISTS idx_insumos_base_org_id ON insumos_base(organization_id);
CREATE INDEX IF NOT EXISTS idx_estoque_logs_org_id ON estoque_logs(organization_id);

-- ============================================================
-- MIGRAÇÃO DOS DADOS ATUAIS
-- ============================================================
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Cria a organização principal
  INSERT INTO organizations (name) VALUES ('Rezende & Vidal') RETURNING id INTO default_org_id;

  -- Insere o usuário atual como admin da organização (assume que todos em auth.users hoje são o dono)
  INSERT INTO profiles (id, organization_id, role, can_view_finance, can_delete_records, can_edit_inventory)
  SELECT id, default_org_id, 'admin', true, true, true
  FROM auth.users
  ON CONFLICT (id) DO NOTHING;

  -- Atualiza todos os registros existentes para pertencer a esta organização
  UPDATE obras SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE insumos_base SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE estoque_logs SET organization_id = default_org_id WHERE organization_id IS NULL;
END $$;

-- Tornar a coluna NOT NULL depois de preencher os dados
ALTER TABLE obras ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE insumos_base ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE estoque_logs ALTER COLUMN organization_id SET NOT NULL;

-- ============================================================
-- ATUALIZAÇÃO DO ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Excluir as antigas politicas baseadas em user_id (se existirem)
DROP POLICY IF EXISTS "obras_select" ON obras;
DROP POLICY IF EXISTS "obras_insert" ON obras;
DROP POLICY IF EXISTS "obras_update" ON obras;
DROP POLICY IF EXISTS "obras_delete" ON obras;

DROP POLICY IF EXISTS "insumos_select" ON insumos_base;
DROP POLICY IF EXISTS "insumos_insert" ON insumos_base;
DROP POLICY IF EXISTS "insumos_update" ON insumos_base;
DROP POLICY IF EXISTS "insumos_delete" ON insumos_base;

DROP POLICY IF EXISTS "estoque_select" ON estoque_logs;
DROP POLICY IF EXISTS "estoque_insert" ON estoque_logs;
DROP POLICY IF EXISTS "estoque_update" ON estoque_logs;
DROP POLICY IF EXISTS "estoque_delete" ON estoque_logs;

-- Políticas para: organizations (O usuário vê as organizações do seu profile)
CREATE POLICY "org_select" ON organizations FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.organization_id = organizations.id)
);

-- Políticas para: profiles (Usuário vê quem é da mesma organização)
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM profiles p2 WHERE p2.id = auth.uid())
);
-- Update de profile: apenas admins da própria org podem atualizar ou inserir (ou se a service_role for usada, RLS é ignorado)
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin' AND p2.organization_id = profiles.organization_id)
);

-- NOVAS Políticas para: obras
CREATE POLICY "obras_select_org" ON obras FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "obras_insert_org" ON obras FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "obras_update_org" ON obras FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
-- Deletar Obras: apenas se tiver a permissão can_delete_records
CREATE POLICY "obras_delete_org" ON obras FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND can_delete_records = true)
);

-- NOVAS Políticas para: insumos_base
CREATE POLICY "insumos_select_org" ON insumos_base FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "insumos_insert_org" ON insumos_base FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "insumos_update_org" ON insumos_base FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "insumos_delete_org" ON insumos_base FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND can_delete_records = true)
);

-- NOVAS Políticas para: estoque_logs
CREATE POLICY "estoque_select_org" ON estoque_logs FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "estoque_insert_org" ON estoque_logs FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND can_edit_inventory = true)
);
CREATE POLICY "estoque_update_org" ON estoque_logs FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND can_edit_inventory = true)
);
CREATE POLICY "estoque_delete_org" ON estoque_logs FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND can_delete_records = true)
);

-- Excluir as politicas em cascata que usavam user_id da tabela obras
DROP POLICY IF EXISTS "bdi_select" ON bdi_config;
DROP POLICY IF EXISTS "bdi_insert" ON bdi_config;
DROP POLICY IF EXISTS "bdi_update" ON bdi_config;
DROP POLICY IF EXISTS "bdi_delete" ON bdi_config;

DROP POLICY IF EXISTS "orcamento_select" ON orcamento_itens;
DROP POLICY IF EXISTS "orcamento_insert" ON orcamento_itens;
DROP POLICY IF EXISTS "orcamento_update" ON orcamento_itens;
DROP POLICY IF EXISTS "orcamento_delete" ON orcamento_itens;

DROP POLICY IF EXISTS "crono_select" ON cronograma;
DROP POLICY IF EXISTS "crono_insert" ON cronograma;
DROP POLICY IF EXISTS "crono_update" ON cronograma;
DROP POLICY IF EXISTS "crono_delete" ON cronograma;

DROP POLICY IF EXISTS "coleta_select" ON mapa_coleta;
DROP POLICY IF EXISTS "coleta_insert" ON mapa_coleta;
DROP POLICY IF EXISTS "coleta_update" ON mapa_coleta;
DROP POLICY IF EXISTS "coleta_delete" ON mapa_coleta;

-- Recriar as políticas em cascata usando a checagem da organização
-- BDI
CREATE POLICY "bdi_select_org" ON bdi_config FOR SELECT USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = bdi_config.obra_id));
CREATE POLICY "bdi_insert_org" ON bdi_config FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM obras WHERE obras.id = bdi_config.obra_id));
CREATE POLICY "bdi_update_org" ON bdi_config FOR UPDATE USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = bdi_config.obra_id));
CREATE POLICY "bdi_delete_org" ON bdi_config FOR DELETE USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = bdi_config.obra_id) AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND can_delete_records = true));

-- ORCAMENTO
CREATE POLICY "orcamento_select_org" ON orcamento_itens FOR SELECT USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = orcamento_itens.obra_id));
CREATE POLICY "orcamento_insert_org" ON orcamento_itens FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM obras WHERE obras.id = orcamento_itens.obra_id));
CREATE POLICY "orcamento_update_org" ON orcamento_itens FOR UPDATE USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = orcamento_itens.obra_id));
CREATE POLICY "orcamento_delete_org" ON orcamento_itens FOR DELETE USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = orcamento_itens.obra_id) AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND can_delete_records = true));

-- CRONOGRAMA
CREATE POLICY "crono_select_org" ON cronograma FOR SELECT USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = cronograma.obra_id));
CREATE POLICY "crono_insert_org" ON cronograma FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM obras WHERE obras.id = cronograma.obra_id));
CREATE POLICY "crono_update_org" ON cronograma FOR UPDATE USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = cronograma.obra_id));
CREATE POLICY "crono_delete_org" ON cronograma FOR DELETE USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = cronograma.obra_id) AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND can_delete_records = true));

-- MAPA COLETA
CREATE POLICY "coleta_select_org" ON mapa_coleta FOR SELECT USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = mapa_coleta.obra_id));
CREATE POLICY "coleta_insert_org" ON mapa_coleta FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM obras WHERE obras.id = mapa_coleta.obra_id));
CREATE POLICY "coleta_update_org" ON mapa_coleta FOR UPDATE USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = mapa_coleta.obra_id));
CREATE POLICY "coleta_delete_org" ON mapa_coleta FOR DELETE USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = mapa_coleta.obra_id) AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND can_delete_records = true));
