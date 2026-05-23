-- ============================================================
-- ORG BRANDING — GREV
-- Rode este script no Supabase SQL Editor
-- ============================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS nome_razao_social TEXT,
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#3C3489';

-- Bucket público para logos das organizações
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-logos', 'org-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: qualquer autenticado pode fazer upload no próprio prefixo
CREATE POLICY "org_logos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'org-logos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "org_logos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'org-logos');

CREATE POLICY "org_logos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'org-logos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "org_logos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'org-logos'
    AND auth.role() = 'authenticated'
  );
