-- ============================================================
-- ERP Rezende & Vidal — Adicionar Email ao Profile
-- Execute este script no SQL Editor do painel do Supabase
-- ============================================================

-- 1. Adicionar coluna email
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Migrar os emails existentes da tabela auth.users para a tabela profiles
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
