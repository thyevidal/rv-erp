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

export type PendingChanges =
  | { type: 'cronograma'; action: 'replace' | 'append'; items: PendingCronogramaItem[] }
  | { type: 'orcamento'; action: 'append'; items: PendingOrcamentoItem[] }
