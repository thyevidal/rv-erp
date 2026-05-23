-- ============================================================
-- RLS POLICIES — GREV
-- Rode este script no Supabase SQL Editor
-- ============================================================

-- Helper: retorna o organization_id do usuário logado
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_select_own" ON organizations;
DROP POLICY IF EXISTS "org_insert_own" ON organizations;
DROP POLICY IF EXISTS "org_update_own" ON organizations;

-- Membros podem ver sua própria organização
CREATE POLICY "org_select_own" ON organizations
  FOR SELECT USING (id = get_my_org_id());

-- Qualquer autenticado pode criar (necessário no cadastro via API)
-- INSERT é feito via service role na API /api/register — não precisa de policy aqui

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_org" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_select_own_org" ON profiles
  FOR SELECT USING (organization_id = get_my_org_id() OR id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- OBRAS
-- ============================================================
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "obras_select_org" ON obras;
DROP POLICY IF EXISTS "obras_insert_org" ON obras;
DROP POLICY IF EXISTS "obras_update_org" ON obras;
DROP POLICY IF EXISTS "obras_delete_org" ON obras;

CREATE POLICY "obras_select_org" ON obras
  FOR SELECT USING (organization_id = get_my_org_id());

CREATE POLICY "obras_insert_org" ON obras
  FOR INSERT WITH CHECK (organization_id = get_my_org_id());

CREATE POLICY "obras_update_org" ON obras
  FOR UPDATE USING (organization_id = get_my_org_id());

CREATE POLICY "obras_delete_org" ON obras
  FOR DELETE USING (organization_id = get_my_org_id());

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_org" ON subscriptions;

CREATE POLICY "subscriptions_select_org" ON subscriptions
  FOR SELECT USING (organization_id = get_my_org_id());

-- INSERT/UPDATE via service role apenas (admin)

-- ============================================================
-- PLANS (leitura pública para todos autenticados)
-- ============================================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_select_all" ON plans;

CREATE POLICY "plans_select_all" ON plans
  FOR SELECT USING (true);

-- ============================================================
-- ORCAMENTO_ITENS
-- ============================================================
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orcamento_select_org" ON orcamento_itens;
DROP POLICY IF EXISTS "orcamento_insert_org" ON orcamento_itens;
DROP POLICY IF EXISTS "orcamento_update_org" ON orcamento_itens;
DROP POLICY IF EXISTS "orcamento_delete_org" ON orcamento_itens;

CREATE POLICY "orcamento_select_org" ON orcamento_itens
  FOR SELECT USING (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

CREATE POLICY "orcamento_insert_org" ON orcamento_itens
  FOR INSERT WITH CHECK (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

CREATE POLICY "orcamento_update_org" ON orcamento_itens
  FOR UPDATE USING (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

CREATE POLICY "orcamento_delete_org" ON orcamento_itens
  FOR DELETE USING (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

-- ============================================================
-- BDI_CONFIG
-- ============================================================
ALTER TABLE bdi_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bdi_select_org" ON bdi_config;
DROP POLICY IF EXISTS "bdi_insert_org" ON bdi_config;
DROP POLICY IF EXISTS "bdi_update_org" ON bdi_config;

CREATE POLICY "bdi_select_org" ON bdi_config
  FOR SELECT USING (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

CREATE POLICY "bdi_insert_org" ON bdi_config
  FOR INSERT WITH CHECK (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

CREATE POLICY "bdi_update_org" ON bdi_config
  FOR UPDATE USING (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

-- ============================================================
-- CRONOGRAMA
-- ============================================================
ALTER TABLE cronograma ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cronograma_select_org" ON cronograma;
DROP POLICY IF EXISTS "cronograma_insert_org" ON cronograma;
DROP POLICY IF EXISTS "cronograma_update_org" ON cronograma;
DROP POLICY IF EXISTS "cronograma_delete_org" ON cronograma;

CREATE POLICY "cronograma_select_org" ON cronograma
  FOR SELECT USING (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

CREATE POLICY "cronograma_insert_org" ON cronograma
  FOR INSERT WITH CHECK (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

CREATE POLICY "cronograma_update_org" ON cronograma
  FOR UPDATE USING (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

CREATE POLICY "cronograma_delete_org" ON cronograma
  FOR DELETE USING (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

-- ============================================================
-- FINANCEIRO_LANCAMENTOS
-- ============================================================
ALTER TABLE financeiro_lancamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financeiro_select_org" ON financeiro_lancamentos;
DROP POLICY IF EXISTS "financeiro_insert_org" ON financeiro_lancamentos;
DROP POLICY IF EXISTS "financeiro_update_org" ON financeiro_lancamentos;
DROP POLICY IF EXISTS "financeiro_delete_org" ON financeiro_lancamentos;

CREATE POLICY "financeiro_select_org" ON financeiro_lancamentos
  FOR SELECT USING (organization_id = get_my_org_id());

CREATE POLICY "financeiro_insert_org" ON financeiro_lancamentos
  FOR INSERT WITH CHECK (organization_id = get_my_org_id());

CREATE POLICY "financeiro_update_org" ON financeiro_lancamentos
  FOR UPDATE USING (organization_id = get_my_org_id());

CREATE POLICY "financeiro_delete_org" ON financeiro_lancamentos
  FOR DELETE USING (organization_id = get_my_org_id());

-- ============================================================
-- ESTOQUE_ITENS
-- ============================================================
ALTER TABLE estoque_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "estoque_select_org" ON estoque_itens;
DROP POLICY IF EXISTS "estoque_insert_org" ON estoque_itens;
DROP POLICY IF EXISTS "estoque_update_org" ON estoque_itens;
DROP POLICY IF EXISTS "estoque_delete_org" ON estoque_itens;

CREATE POLICY "estoque_select_org" ON estoque_itens
  FOR SELECT USING (organization_id = get_my_org_id());

CREATE POLICY "estoque_insert_org" ON estoque_itens
  FOR INSERT WITH CHECK (organization_id = get_my_org_id());

CREATE POLICY "estoque_update_org" ON estoque_itens
  FOR UPDATE USING (organization_id = get_my_org_id());

CREATE POLICY "estoque_delete_org" ON estoque_itens
  FOR DELETE USING (organization_id = get_my_org_id());

-- ============================================================
-- ESTOQUE_MOVIMENTACOES
-- ============================================================
ALTER TABLE estoque_movimentacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "estoque_mov_select_org" ON estoque_movimentacoes;
DROP POLICY IF EXISTS "estoque_mov_insert_org" ON estoque_movimentacoes;

CREATE POLICY "estoque_mov_select_org" ON estoque_movimentacoes
  FOR SELECT USING (item_id IN (SELECT id FROM estoque_itens WHERE organization_id = get_my_org_id()));

CREATE POLICY "estoque_mov_insert_org" ON estoque_movimentacoes
  FOR INSERT WITH CHECK (item_id IN (SELECT id FROM estoque_itens WHERE organization_id = get_my_org_id()));

-- ============================================================
-- AGENDA_EVENTOS
-- ============================================================
ALTER TABLE agenda_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agenda_select_org" ON agenda_eventos;
DROP POLICY IF EXISTS "agenda_insert_org" ON agenda_eventos;
DROP POLICY IF EXISTS "agenda_update_org" ON agenda_eventos;
DROP POLICY IF EXISTS "agenda_delete_org" ON agenda_eventos;

CREATE POLICY "agenda_select_org" ON agenda_eventos
  FOR SELECT USING (organization_id = get_my_org_id());

CREATE POLICY "agenda_insert_org" ON agenda_eventos
  FOR INSERT WITH CHECK (organization_id = get_my_org_id());

CREATE POLICY "agenda_update_org" ON agenda_eventos
  FOR UPDATE USING (organization_id = get_my_org_id());

CREATE POLICY "agenda_delete_org" ON agenda_eventos
  FOR DELETE USING (organization_id = get_my_org_id());

-- ============================================================
-- INSUMOS_BASE (banco de insumos — leitura para todos, escrita por org)
-- ============================================================
ALTER TABLE insumos_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insumos_select_all" ON insumos_base;
DROP POLICY IF EXISTS "insumos_insert_org" ON insumos_base;
DROP POLICY IF EXISTS "insumos_update_org" ON insumos_base;
DROP POLICY IF EXISTS "insumos_delete_org" ON insumos_base;

CREATE POLICY "insumos_select_all" ON insumos_base
  FOR SELECT USING (organization_id IS NULL OR organization_id = get_my_org_id());

CREATE POLICY "insumos_insert_org" ON insumos_base
  FOR INSERT WITH CHECK (organization_id = get_my_org_id());

CREATE POLICY "insumos_update_org" ON insumos_base
  FOR UPDATE USING (organization_id = get_my_org_id());

CREATE POLICY "insumos_delete_org" ON insumos_base
  FOR DELETE USING (organization_id = get_my_org_id());

-- ============================================================
-- MAPA_COLETA (vinculada à obra)
-- ============================================================
ALTER TABLE mapa_coleta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mapa_coleta_org" ON mapa_coleta;
CREATE POLICY "mapa_coleta_org" ON mapa_coleta
  FOR ALL USING (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

-- ============================================================
-- ESTOQUE_LOGS (vinculada à obra)
-- ============================================================
ALTER TABLE estoque_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "estoque_logs_org" ON estoque_logs;
CREATE POLICY "estoque_logs_org" ON estoque_logs
  FOR ALL USING (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

-- ============================================================
-- INSUMO_FORNECEDORES (leitura para todos autenticados, escrita livre)
-- ============================================================
ALTER TABLE insumo_fornecedores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insumo_fornecedores_select" ON insumo_fornecedores;
DROP POLICY IF EXISTS "insumo_fornecedores_insert" ON insumo_fornecedores;
DROP POLICY IF EXISTS "insumo_fornecedores_delete" ON insumo_fornecedores;

CREATE POLICY "insumo_fornecedores_select" ON insumo_fornecedores
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "insumo_fornecedores_insert" ON insumo_fornecedores
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "insumo_fornecedores_delete" ON insumo_fornecedores
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- AC_* (Aquisição e Construção) — vinculadas à obra
-- ============================================================
ALTER TABLE ac_fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_acessos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_documentos ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para validar obra da org
-- ac_fases
DROP POLICY IF EXISTS "ac_fases_org" ON ac_fases;
CREATE POLICY "ac_fases_org" ON ac_fases
  FOR ALL USING (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

-- ac_checklist
DROP POLICY IF EXISTS "ac_checklist_org" ON ac_checklist;
CREATE POLICY "ac_checklist_org" ON ac_checklist
  FOR ALL USING (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

-- ac_acessos
DROP POLICY IF EXISTS "ac_acessos_org" ON ac_acessos;
CREATE POLICY "ac_acessos_org" ON ac_acessos
  FOR ALL USING (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

-- ac_documentos (leitura pública por token é feita via service role na API do portal)
DROP POLICY IF EXISTS "ac_documentos_org" ON ac_documentos;
CREATE POLICY "ac_documentos_org" ON ac_documentos
  FOR ALL USING (obra_id IN (SELECT id FROM obras WHERE organization_id = get_my_org_id()));

-- ============================================================
-- COUPONS (leitura para todos autenticados — para validar cupom no cadastro)
-- ============================================================
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_select_all" ON coupons;
CREATE POLICY "coupons_select_all" ON coupons
  FOR SELECT USING (true);
