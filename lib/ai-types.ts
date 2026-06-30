export type PendingCronogramaItem = {
  tarefa: string
  data_prevista_inicio: string | null
  data_prevista_fim: string | null
}

export type PendingOrcamentoItem = {
  etapa: string
  subetapa: string | null
  descricao: string
  tipo: string
  unidade: string
  quantidade: number
  custo_unitario_aplicado: number
}

export type PendingDeleteItem = {
  id: string
  descricao: string
  etapa?: string
  custo_total?: number
}

export type PendingUpdateOrcamentoItem = {
  id: string
  descricao?: string
  etapa?: string
  subetapa?: string
  quantidade?: number
  custo_unitario_aplicado?: number
  unidade?: string
}

export type PendingUpdateCronogramaItem = {
  id: string
  tarefa?: string
  data_prevista_inicio?: string | null
  data_prevista_fim?: string | null
}

export type PendingChanges =
  | { type: 'cronograma'; action: 'replace' | 'append'; items: PendingCronogramaItem[] }
  | { type: 'orcamento'; action: 'append'; items: PendingOrcamentoItem[] }
  | { type: 'delete_orcamento'; items: PendingDeleteItem[] }
  | { type: 'update_orcamento'; items: PendingUpdateOrcamentoItem[] }
  | { type: 'update_cronograma'; items: PendingUpdateCronogramaItem[] }
