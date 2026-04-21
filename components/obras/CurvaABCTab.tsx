'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { OrcamentoItem, CurvaABCItem } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const CLASSE_CONFIG = {
  A: { color: '#ef4444', label: 'A — Vital (80%)', bg: 'bg-red-500/10 text-red-400 border-red-500/30' },
  B: { color: '#f97316', label: 'B — Importante (15%)', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  C: { color: '#22c55e', label: 'C — Trivial (5%)', bg: 'bg-green-500/10 text-green-400 border-green-500/30' },
}

function calcCurvaABC(itens: OrcamentoItem[]): CurvaABCItem[] {
  const totalGeral = itens.reduce((a, i) => a + i.quantidade * i.custo_unitario_aplicado, 0)
  if (totalGeral === 0) return []

  const sorted = [...itens]
    .map((i) => ({ ...i, valor_total: i.quantidade * i.custo_unitario_aplicado }))
    .sort((a, b) => b.valor_total - a.valor_total)

  let acumulado = 0
  return sorted.map((i): CurvaABCItem => {
    const pct = (i.valor_total / totalGeral) * 100
    acumulado += pct
    const classe = acumulado <= 80 ? 'A' : acumulado <= 95 ? 'B' : 'C'
    return {
      id: i.id,
      descricao: i.descricao,
      unidade: i.unidade,
      quantidade: i.quantidade,
      custo_unitario: i.custo_unitario_aplicado,
      valor_total: i.valor_total,
      percentual_individual: pct,
      percentual_acumulado: acumulado,
      classe,
      etapa: i.etapa,
      tipo: i.tipo,
    }
  })
}

export default function CurvaABCTab({ itens }: { itens: OrcamentoItem[] }) {
  const curva = useMemo(() => calcCurvaABC(itens), [itens])

  const contagem = { A: 0, B: 0, C: 0 }
  const valor = { A: 0, B: 0, C: 0 }
  for (const i of curva) {
    contagem[i.classe]++
    valor[i.classe] += i.valor_total
  }

  const top10 = curva.slice(0, 10).map((i) => ({
    name: i.descricao.length > 20 ? i.descricao.slice(0, 20) + '…' : i.descricao,
    valor: i.valor_total,
    classe: i.classe,
  }))

  if (curva.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Adicione itens ao orçamento para gerar a Curva ABC.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        {(['A', 'B', 'C'] as const).map((cls) => {
          const cfg = CLASSE_CONFIG[cls]
          return (
            <Card key={cls} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg}`}>
                    Classe {cls}
                  </span>
                  <span className="text-xs text-muted-foreground">{contagem[cls]} itens</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(valor[cls])}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Gráfico Top 10 */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Top 10 Insumos por Valor</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(0.5 0 0 / 0.1)" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="valor" radius={[0, 4, 4, 0]} name="Valor Total">
                {top10.map((entry, i) => (
                  <Cell key={i} fill={CLASSE_CONFIG[entry.classe as 'A' | 'B' | 'C'].color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela Completa */}
      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left px-4 py-2.5 font-medium">#</th>
                <th className="text-left px-4 py-2.5 font-medium">Descrição</th>
                <th className="text-left px-2 py-2.5 font-medium">Etapa</th>
                <th className="text-right px-2 py-2.5 font-medium">Qtd</th>
                <th className="text-right px-2 py-2.5 font-medium">Custo Unit.</th>
                <th className="text-right px-2 py-2.5 font-medium">Total</th>
                <th className="text-right px-2 py-2.5 font-medium">% Individual</th>
                <th className="text-right px-2 py-2.5 font-medium">% Acum.</th>
                <th className="text-center px-4 py-2.5 font-medium">Classe</th>
              </tr>
            </thead>
            <tbody>
              {curva.map((item, idx) => {
                const cfg = CLASSE_CONFIG[item.classe]
                return (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{item.descricao}</td>
                    <td className="px-2 py-2.5 text-muted-foreground text-xs">{item.etapa}</td>
                    <td className="text-right px-2 py-2.5">{item.quantidade} {item.unidade}</td>
                    <td className="text-right px-2 py-2.5">{formatCurrency(item.custo_unitario)}</td>
                    <td className="text-right px-2 py-2.5 font-semibold">{formatCurrency(item.valor_total)}</td>
                    <td className="text-right px-2 py-2.5">{item.percentual_individual.toFixed(2)}%</td>
                    <td className="text-right px-2 py-2.5">{item.percentual_acumulado.toFixed(2)}%</td>
                    <td className="text-center px-4 py-2.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.bg}`}>
                        {item.classe}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
