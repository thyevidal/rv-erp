// ============================================================
// Tipos TypeScript — ERP Rezende & Vidal
// ============================================================

export type ObraStatus = 'PLANEJAMENTO' | 'EM_ANDAMENTO' | 'PAUSADA' | 'CONCLUIDA' | 'CANCELADA'
export type ItemTipo = 'MATERIAL' | 'MAO_DE_OBRA'
export type CronoStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'ATRASADA'
export type CurvaABCClasse = 'A' | 'B' | 'C'

// ---- Organizations & Profiles ----
export type UserRole = 'admin' | 'member'

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Profile {
  id: string
  organization_id: string
  name: string | null
  email?: string | null
  role: UserRole
  can_view_finance: boolean
  can_delete_records: boolean
  can_edit_inventory: boolean
  created_at: string
}

// ---- Obras ----
export interface Obra {
  id: string
  nome: string
  endereco?: string | null
  status: ObraStatus
  data_inicio?: string | null
  data_fim?: string | null
  descricao?: string | null
  deleted_at?: string | null
  created_at: string
  updated_at: string
  user_id: string
  organization_id: string
}
export type ObraInsert = Omit<Obra, 'id' | 'created_at' | 'updated_at'>
export type ObraUpdate = Partial<ObraInsert>

// ---- BDI Config ----
export interface BdiConfig {
  id: string
  obra_id: string
  impostos: number
  margem_lucro: number
  seguros: number
  custos_indiretos: number
  bdi_total: number
  created_at: string
  updated_at: string
}
export type BdiConfigInsert = Omit<BdiConfig, 'id' | 'created_at' | 'updated_at' | 'bdi_total'>
export type BdiConfigUpdate = Partial<BdiConfigInsert>

// ---- Insumos Base ----
export interface InsumoBase {
  id: string
  descricao: string
  unidade: string
  custo_unitario: number
  categoria?: string | null
  created_at: string
  updated_at: string
  user_id: string
  organization_id: string
}
export type InsumoInsert = Omit<InsumoBase, 'id' | 'created_at' | 'updated_at'>
export type InsumoUpdate = Partial<InsumoInsert>

// ---- Orçamento Itens ----
export interface OrcamentoItem {
  id: string
  obra_id: string
  etapa: string
  subetapa?: string | null
  descricao: string
  insumo_id?: string | null
  unidade: string
  quantidade: number
  custo_unitario_aplicado: number
  tipo: ItemTipo
  observacao?: string | null
  created_at: string
  updated_at: string
}
export type OrcamentoItemInsert = Omit<OrcamentoItem, 'id' | 'created_at' | 'updated_at'>
export type OrcamentoItemUpdate = Partial<OrcamentoItemInsert>

export interface OrcamentoItemComTotais extends OrcamentoItem {
  total_custo: number
  total_venda: number
  bdi_total?: number | null
}

// ---- Cronograma ----
export interface Cronograma {
  id: string
  obra_id: string
  tarefa: string
  descricao?: string | null
  data_prevista_inicio: string
  data_prevista_fim: string
  data_real_fim?: string | null
  status: CronoStatus
  percentual_conclusao: number
  dependencia_id?: string | null
  responsavel?: string | null
  created_at: string
  updated_at: string
}
export type CronogramaInsert = Omit<Cronograma, 'id' | 'created_at' | 'updated_at'>
export type CronogramaUpdate = Partial<CronogramaInsert>

// ---- Mapa de Coleta ----
export interface MapaColeta {
  id: string
  orcamento_item_id: string
  obra_id: string
  fornecedor: string
  valor_unitario: number
  prazo_entrega?: number | null
  condicao_pagamento?: string | null
  anexo_url?: string | null
  selecionado: boolean
  observacao?: string | null
  created_at: string
  updated_at: string
}
export type MapaColetaInsert = Omit<MapaColeta, 'id' | 'created_at' | 'updated_at'>
export type MapaColetaUpdate = Partial<MapaColetaInsert>

// ---- Estoque Logs ----
export interface EstoqueLog {
  id: string
  obra_id: string
  insumo_id?: string | null
  orcamento_item_id?: string | null
  descricao: string
  unidade: string
  quantidade_entregue: number
  data_entrega: string
  nota_fiscal?: string | null
  fornecedor?: string | null
  confirmado_por?: string | null
  observacao?: string | null
  created_at: string
  user_id: string
  organization_id: string
}
export type EstoqueLogInsert = Omit<EstoqueLog, 'id' | 'created_at'>

// ---- Curva ABC ----
export interface CurvaABCItem {
  id: string
  descricao: string
  unidade: string
  quantidade: number
  custo_unitario: number
  valor_total: number
  percentual_individual: number
  percentual_acumulado: number
  classe: CurvaABCClasse
  etapa: string
  tipo: ItemTipo
}

// ---- Dashboard Stats ----
export interface DashboardStats {
  totalObras: number
  obrasAtivas: number
  totalGasto: number
  roiMedio: number
  idpGeral: number
}

// ---- Import XLSX Row ----
export interface XlsxImportRow {
  etapa?: string
  subetapa?: string
  descricao: string
  unidade: string
  quantidade: number
  preco: number
  tipo?: ItemTipo
}
