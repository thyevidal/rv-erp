import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react'
import FinanceiroOrgClient from './FinanceiroOrgClient'

export default async function FinanceiroOrgPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const orgId = profile?.organization_id

  // Buscar obras ativas da org
  const { data: obras } = await supabase
    .from('obras')
    .select('id, nome, status')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('nome')

  const obraIds = (obras ?? []).map((o) => o.id)

  // Buscar lançamentos de todas as obras da org
  const { data: lancamentos } = obraIds.length > 0
    ? await supabase
        .from('financeiro_lancamentos')
        .select('*, obras(nome)')
        .in('obra_id', obraIds)
        .order('data', { ascending: false })
    : { data: [] }

  // Buscar orçamentos para receita prevista
  const { data: orcItens } = obraIds.length > 0
    ? await supabase
        .from('orcamento_itens')
        .select('obra_id, quantidade, custo_unitario_aplicado')
        .in('obra_id', obraIds)
    : { data: [] }

  const { data: bdis } = obraIds.length > 0
    ? await supabase.from('bdi_config').select('obra_id, bdi_total').in('obra_id', obraIds)
    : { data: [] }

  const bdiMap = new Map((bdis ?? []).map((b) => [b.obra_id, b.bdi_total]))
  const custoMap = new Map<string, number>()
  for (const item of orcItens ?? []) {
    custoMap.set(item.obra_id, (custoMap.get(item.obra_id) ?? 0) + item.quantidade * item.custo_unitario_aplicado)
  }

  // KPIs
  const lancs = lancamentos ?? []
  const totalEntradas = lancs.filter((l) => l.tipo === 'ENTRADA').reduce((s, l) => s + l.valor, 0)
  const totalSaidas = lancs.filter((l) => l.tipo === 'SAIDA').reduce((s, l) => s + l.valor, 0)
  const saldo = totalEntradas - totalSaidas

  const receitaPrevista = obraIds.reduce((s, id) => {
    const custo = custoMap.get(id) ?? 0
    const bdi = bdiMap.get(id) ?? 0
    return s + (bdi > 0 ? custo * (1 + bdi / 100) : custo)
  }, 0)

  // Saúde por obra (apenas obras em andamento)
  const obrasAndamento = (obras ?? []).filter((o) => o.status === 'EM_ANDAMENTO')
  const saudePorObra = obrasAndamento.map((obra) => {
    const entradas = lancs.filter((l) => l.obra_id === obra.id && l.tipo === 'ENTRADA').reduce((s, l) => s + l.valor, 0)
    const saidas = lancs.filter((l) => l.obra_id === obra.id && l.tipo === 'SAIDA').reduce((s, l) => s + l.valor, 0)
    const custo = custoMap.get(obra.id) ?? 0
    const bdi = bdiMap.get(obra.id) ?? 0
    const previstoVenda = bdi > 0 ? custo * (1 + bdi / 100) : custo
    const pctRecebido = previstoVenda > 0 ? (entradas / previstoVenda) * 100 : 0
    const pctGasto = custo > 0 ? (saidas / custo) * 100 : 0
    const saldoObra = entradas - saidas

    let saude: 'verde' | 'amarelo' | 'vermelho' = 'verde'
    if (saidas > custo * 1.1) saude = 'vermelho'
    else if (saidas > custo * 0.9) saude = 'amarelo'

    return { obra, entradas, saidas, previstoVenda, pctRecebido, pctGasto, saldoObra, saude }
  })

  const kpis = [
    { label: 'Total Recebido', value: formatCurrency(totalEntradas), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Total Gasto', value: formatCurrency(totalSaidas), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Saldo Consolidado', value: formatCurrency(saldo), icon: DollarSign, color: saldo >= 0 ? 'text-primary' : 'text-red-500', bg: 'bg-primary/10' },
    { label: 'Receita Prevista', value: formatCurrency(receitaPrevista), icon: Target, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Consolidado financeiro de todas as obras.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="border-border/60">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Saúde por obra */}
      {saudePorObra.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Saúde Financeira por Obra</h2>
          <div className="border border-border/60 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Obra</th>
                  <th className="px-4 py-3 font-medium text-right">Previsto</th>
                  <th className="px-4 py-3 font-medium text-right">Recebido</th>
                  <th className="px-4 py-3 font-medium text-right">Gasto</th>
                  <th className="px-4 py-3 font-medium text-right">Saldo</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {saudePorObra.map(({ obra, entradas, saidas, previstoVenda, pctRecebido, pctGasto, saldoObra, saude }) => (
                  <tr key={obra.id} className="border-t border-border/60 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{obra.nome}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(previstoVenda)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-green-600 font-medium">{formatCurrency(entradas)}</div>
                      <div className="text-xs text-muted-foreground">{pctRecebido.toFixed(0)}% do previsto</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-red-500 font-medium">{formatCurrency(saidas)}</div>
                      <div className="text-xs text-muted-foreground">{pctGasto.toFixed(0)}% do custo</div>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${saldoObra >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(saldoObra)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${saude === 'verde' ? 'bg-green-500' : saude === 'amarelo' ? 'bg-yellow-500' : 'bg-red-500'}`} title={saude === 'verde' ? 'Saudável' : saude === 'amarelo' ? 'Atenção' : 'Crítico'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabela consolidada + novo lançamento (client) */}
      <FinanceiroOrgClient
        lancamentos={lancs as any}
        obras={obras ?? []}
        orgId={orgId}
        userId={user.id}
      />
    </div>
  )
}
