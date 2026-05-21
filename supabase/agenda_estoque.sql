-- ============================================================
-- Migration: Agenda + Estoque + Dashboard layout + Financeiro
-- Rodar no Supabase SQL Editor
-- ============================================================

-- 1. Dashboard layout por usuário
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dashboard_layout JSONB DEFAULT NULL;

-- 2. Agenda de eventos
CREATE TABLE IF NOT EXISTS agenda_eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  obra_id UUID REFERENCES obras(id) ON DELETE SET NULL,
  criado_por UUID NOT NULL REFERENCES profiles(id),
  responsavel_id UUID REFERENCES profiles(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,
  tipo TEXT NOT NULL DEFAULT 'EVENTO'
    CHECK (tipo IN ('EVENTO','REUNIAO','PRAZO','VISITA')),
  origem TEXT NOT NULL DEFAULT 'MANUAL'
    CHECK (origem IN ('MANUAL','CRONOGRAMA')),
  concluido BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agenda_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "membros veem agenda da org" ON agenda_eventos;
CREATE POLICY "membros veem agenda da org"
ON agenda_eventos FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "membros gerenciam seus eventos" ON agenda_eventos;
CREATE POLICY "membros gerenciam seus eventos"
ON agenda_eventos FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- 3. Financeiro: campo visivel_org
ALTER TABLE financeiro_lancamentos
  ADD COLUMN IF NOT EXISTS visivel_org BOOLEAN NOT NULL DEFAULT TRUE;

-- 4. Estoque — itens
CREATE TABLE IF NOT EXISTS estoque_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  unidade TEXT NOT NULL DEFAULT 'un',
  categoria TEXT,
  consumivel BOOLEAN NOT NULL DEFAULT FALSE,
  quantidade_total NUMERIC(12,3) NOT NULL DEFAULT 0,
  quantidade_disponivel NUMERIC(12,3) NOT NULL DEFAULT 0,
  valor_unitario NUMERIC(12,2),
  localizacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE estoque_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org acessa estoque_itens" ON estoque_itens;
CREATE POLICY "org acessa estoque_itens" ON estoque_itens
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- 5. Estoque — movimentações
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES estoque_itens(id) ON DELETE CASCADE,
  obra_id UUID REFERENCES obras(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'ENTRADA','SAIDA','ALOCACAO','DEVOLUCAO','BAIXA'
  )),
  quantidade NUMERIC(12,3) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  responsavel TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE estoque_movimentacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org acessa estoque_movimentacoes" ON estoque_movimentacoes;
CREATE POLICY "org acessa estoque_movimentacoes"
ON estoque_movimentacoes FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);
