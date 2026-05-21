// Arquivo sem 'use client' — pode ser importado tanto por Server quanto Client Components

export type BlockId = 'kpis' | 'charts' | 'composicao' | 'insights'

export const BLOCK_LABELS: Record<BlockId, string> = {
  kpis: 'KPIs — Indicadores principais',
  charts: 'Gráficos',
  composicao: 'Composição Geral dos Orçamentos',
  insights: 'Insights',
}

export const DEFAULT_ORDER: BlockId[] = ['kpis', 'charts', 'composicao', 'insights']

export function parseDashboardLayout(raw: unknown): BlockId[] {
  if (!Array.isArray(raw)) return DEFAULT_ORDER
  const valid = raw.filter((x): x is BlockId => typeof x === 'string' && x in BLOCK_LABELS)
  const missing = DEFAULT_ORDER.filter((b) => !valid.includes(b))
  return [...valid, ...missing]
}
