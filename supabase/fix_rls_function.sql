-- ============================================================
-- FIX: get_my_org_id() como SECURITY DEFINER
-- Necessário para evitar recursão infinita quando chamada dentro
-- de políticas RLS de outras tabelas (ex: obras → profiles → obras).
-- Rode este script no Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- Política de UPDATE para organizations
-- Permite que membros atualizem dados da própria organização
-- (necessário para salvar branding do PDF via API)
-- ============================================================
DROP POLICY IF EXISTS "org_update_own" ON organizations;
CREATE POLICY "org_update_own" ON organizations
  FOR UPDATE USING (id = get_my_org_id());
