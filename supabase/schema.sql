-- ============================================================
-- ERP Rezende & Vidal — Schema Supabase/PostgreSQL
-- Execute este script no SQL Editor do painel do Supabase
-- ============================================================

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE obra_status AS ENUM ('PLANEJAMENTO', 'EM_ANDAMENTO', 'PAUSADA', 'CONCLUIDA', 'CANCELADA');
CREATE TYPE item_tipo AS ENUM ('MATERIAL', 'MAO_DE_OBRA');
CREATE TYPE crono_status AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'ATRASADA');
CREATE TYPE curva_abc_classe AS ENUM ('A', 'B', 'C');

-- ============================================================
-- TABELA: obras
-- ============================================================
CREATE TABLE obras (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  endereco    TEXT,
  status      obra_status NOT NULL DEFAULT 'PLANEJAMENTO',
  data_inicio DATE,
  data_fim    DATE,
  descricao   TEXT,
  deleted_at  TIMESTAMPTZ DEFAULT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_obras_user_id ON obras(user_id);
CREATE INDEX idx_obras_status ON obras(status);

-- ============================================================
-- TABELA: bdi_config
-- ============================================================
CREATE TABLE bdi_config (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id           UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  impostos          NUMERIC(5,2) NOT NULL DEFAULT 0,   -- % (ex: 8.65)
  margem_lucro      NUMERIC(5,2) NOT NULL DEFAULT 0,   -- %
  seguros           NUMERIC(5,2) NOT NULL DEFAULT 0,   -- %
  custos_indiretos  NUMERIC(5,2) NOT NULL DEFAULT 0,   -- %
  -- BDI total calculado: 1 - (1/(1+impostos/100)*(1+margem/100)*...)
  -- Armazenamos a taxa final para consulta rápida
  bdi_total         NUMERIC(6,3) GENERATED ALWAYS AS (
    impostos + margem_lucro + seguros + custos_indiretos
  ) STORED,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(obra_id)
);

-- ============================================================
-- TABELA: insumos_base (catálogo master de insumos/preços)
-- ============================================================
CREATE TABLE insumos_base (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  descricao      TEXT NOT NULL,
  unidade        TEXT NOT NULL,         -- m², m³, kg, un, vb, etc.
  custo_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  categoria      TEXT,                  -- ex: Concreto, Aço, Elétrica, etc.
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_insumos_base_user_id ON insumos_base(user_id);
CREATE INDEX idx_insumos_base_categoria ON insumos_base(categoria);

-- ============================================================
-- TABELA: orcamento_itens
-- ============================================================
CREATE TABLE orcamento_itens (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id                UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  etapa                  TEXT NOT NULL,           -- ex: "1. Fundação"
  subetapa               TEXT,                    -- ex: "1.1 Escavação"
  descricao              TEXT NOT NULL,           -- nome do serviço/insumo
  insumo_id              UUID REFERENCES insumos_base(id) ON DELETE SET NULL,
  unidade                TEXT NOT NULL DEFAULT 'un',
  quantidade             NUMERIC(12,3) NOT NULL DEFAULT 0,
  custo_unitario_aplicado NUMERIC(12,2) NOT NULL DEFAULT 0,  -- snapshot do custo
  tipo                   item_tipo NOT NULL DEFAULT 'MATERIAL',
  observacao             TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orcamento_obra_id ON orcamento_itens(obra_id);
CREATE INDEX idx_orcamento_etapa ON orcamento_itens(obra_id, etapa);

-- View calculada: total e preço com BDI
CREATE OR REPLACE VIEW orcamento_itens_view AS
SELECT
  oi.*,
  oi.quantidade * oi.custo_unitario_aplicado AS total_custo,
  bc.bdi_total,
  CASE
    WHEN bc.bdi_total IS NOT NULL AND bc.bdi_total < 100
    THEN ROUND((oi.quantidade * oi.custo_unitario_aplicado) / (1 - bc.bdi_total / 100), 2)
    ELSE oi.quantidade * oi.custo_unitario_aplicado
  END AS total_venda
FROM orcamento_itens oi
LEFT JOIN bdi_config bc ON bc.obra_id = oi.obra_id;

-- ============================================================
-- TABELA: cronograma
-- ============================================================
CREATE TABLE cronograma (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id               UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  tarefa                TEXT NOT NULL,
  descricao             TEXT,
  data_prevista_inicio  DATE NOT NULL,
  data_prevista_fim     DATE NOT NULL,
  data_real_fim         DATE,
  status                crono_status NOT NULL DEFAULT 'PENDENTE',
  percentual_conclusao  INTEGER NOT NULL DEFAULT 0 CHECK (percentual_conclusao BETWEEN 0 AND 100),
  dependencia_id        UUID REFERENCES cronograma(id) ON DELETE SET NULL,
  responsavel           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cronograma_obra_id ON cronograma(obra_id);
CREATE INDEX idx_cronograma_status ON cronograma(obra_id, status);

-- ============================================================
-- TABELA: mapa_coleta
-- ============================================================
CREATE TABLE mapa_coleta (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orcamento_item_id UUID NOT NULL REFERENCES orcamento_itens(id) ON DELETE CASCADE,
  obra_id           UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  fornecedor        TEXT NOT NULL,
  valor_unitario    NUMERIC(12,2) NOT NULL DEFAULT 0,
  prazo_entrega     INTEGER,                -- em dias
  condicao_pagamento TEXT,
  anexo_url         TEXT,                  -- Supabase Storage path
  selecionado       BOOLEAN NOT NULL DEFAULT FALSE,
  observacao        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mapa_coleta_item_id ON mapa_coleta(orcamento_item_id);
CREATE INDEX idx_mapa_coleta_obra_id ON mapa_coleta(obra_id);

-- ============================================================
-- TABELA: estoque_logs (recebimento de materiais)
-- ============================================================
CREATE TABLE estoque_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id             UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  insumo_id           UUID REFERENCES insumos_base(id) ON DELETE SET NULL,
  orcamento_item_id   UUID REFERENCES orcamento_itens(id) ON DELETE SET NULL,
  descricao           TEXT NOT NULL,          -- snapshot da descrição
  unidade             TEXT NOT NULL,
  quantidade_entregue NUMERIC(12,3) NOT NULL DEFAULT 0,
  data_entrega        DATE NOT NULL DEFAULT CURRENT_DATE,
  nota_fiscal         TEXT,
  fornecedor          TEXT,
  confirmado_por      TEXT,                   -- nome do mestre de obras
  observacao          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_estoque_obra_id ON estoque_logs(obra_id);
CREATE INDEX idx_estoque_data ON estoque_logs(obra_id, data_entrega);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_obras_updated_at BEFORE UPDATE ON obras FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bdi_updated_at BEFORE UPDATE ON bdi_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_insumos_updated_at BEFORE UPDATE ON insumos_base FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orcamento_updated_at BEFORE UPDATE ON orcamento_itens FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cronograma_updated_at BEFORE UPDATE ON cronograma FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_mapa_coleta_updated_at BEFORE UPDATE ON mapa_coleta FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE bdi_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE cronograma ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapa_coleta ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_logs ENABLE ROW LEVEL SECURITY;

-- obras: usuário vê apenas suas obras
CREATE POLICY "obras_select" ON obras FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "obras_insert" ON obras FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "obras_update" ON obras FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "obras_delete" ON obras FOR DELETE USING (auth.uid() = user_id);

-- bdi_config: acesso via obra
CREATE POLICY "bdi_select" ON bdi_config FOR SELECT
  USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = bdi_config.obra_id AND obras.user_id = auth.uid()));
CREATE POLICY "bdi_insert" ON bdi_config FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM obras WHERE obras.id = bdi_config.obra_id AND obras.user_id = auth.uid()));
CREATE POLICY "bdi_update" ON bdi_config FOR UPDATE
  USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = bdi_config.obra_id AND obras.user_id = auth.uid()));
CREATE POLICY "bdi_delete" ON bdi_config FOR DELETE
  USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = bdi_config.obra_id AND obras.user_id = auth.uid()));

-- insumos_base
CREATE POLICY "insumos_select" ON insumos_base FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insumos_insert" ON insumos_base FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insumos_update" ON insumos_base FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "insumos_delete" ON insumos_base FOR DELETE USING (auth.uid() = user_id);

-- orcamento_itens: acesso via obra
CREATE POLICY "orcamento_select" ON orcamento_itens FOR SELECT
  USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = orcamento_itens.obra_id AND obras.user_id = auth.uid()));
CREATE POLICY "orcamento_insert" ON orcamento_itens FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM obras WHERE obras.id = orcamento_itens.obra_id AND obras.user_id = auth.uid()));
CREATE POLICY "orcamento_update" ON orcamento_itens FOR UPDATE
  USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = orcamento_itens.obra_id AND obras.user_id = auth.uid()));
CREATE POLICY "orcamento_delete" ON orcamento_itens FOR DELETE
  USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = orcamento_itens.obra_id AND obras.user_id = auth.uid()));

-- cronograma
CREATE POLICY "crono_select" ON cronograma FOR SELECT
  USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = cronograma.obra_id AND obras.user_id = auth.uid()));
CREATE POLICY "crono_insert" ON cronograma FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM obras WHERE obras.id = cronograma.obra_id AND obras.user_id = auth.uid()));
CREATE POLICY "crono_update" ON cronograma FOR UPDATE
  USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = cronograma.obra_id AND obras.user_id = auth.uid()));
CREATE POLICY "crono_delete" ON cronograma FOR DELETE
  USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = cronograma.obra_id AND obras.user_id = auth.uid()));

-- mapa_coleta
CREATE POLICY "coleta_select" ON mapa_coleta FOR SELECT
  USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = mapa_coleta.obra_id AND obras.user_id = auth.uid()));
CREATE POLICY "coleta_insert" ON mapa_coleta FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM obras WHERE obras.id = mapa_coleta.obra_id AND obras.user_id = auth.uid()));
CREATE POLICY "coleta_update" ON mapa_coleta FOR UPDATE
  USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = mapa_coleta.obra_id AND obras.user_id = auth.uid()));
CREATE POLICY "coleta_delete" ON mapa_coleta FOR DELETE
  USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = mapa_coleta.obra_id AND obras.user_id = auth.uid()));

-- estoque_logs
CREATE POLICY "estoque_select" ON estoque_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "estoque_insert" ON estoque_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "estoque_update" ON estoque_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "estoque_delete" ON estoque_logs FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE: bucket para anexos do mapa de coleta
-- ============================================================
-- Execute no painel do Supabase > Storage > New bucket
-- Nome: coleta-anexos, Public: false
-- Ou via SQL:
INSERT INTO storage.buckets (id, name, public) VALUES ('coleta-anexos', 'coleta-anexos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy de storage
CREATE POLICY "coleta_storage_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'coleta-anexos' AND auth.role() = 'authenticated');
CREATE POLICY "coleta_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'coleta-anexos' AND auth.role() = 'authenticated');
CREATE POLICY "coleta_storage_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'coleta-anexos' AND auth.role() = 'authenticated');
