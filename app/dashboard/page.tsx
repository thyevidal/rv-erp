import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, calcBdiPrecoVenda } from '@/lib/utils'
import {
  HardHat, TrendingUp, DollarSign, Activity, AlertTriangle,
  CheckCircle2, Clock, PauseCircle, Trophy, Target, Layers,
  ClipboardX, Calculator,
} from 'lucide-react'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import ComposicaoModal from '@/components/dashboard/ComposicaoModal'
import DashboardCustomizer from '@/components/dashboard/DashboardCustomizer'
import { parseDashboardLayout } from '@/lib/dashboard-layout'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PLANEJAMENTO: { label: 'Planejamento', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Clock },
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-primary/15 text-primary border-primary/30', icon: Activity },
  PAUSADA: { label: 'Pausada', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: PauseCircle },
  CONCLUIDA: { label: 'Concluída', color: 'bg-green-500/15 text-green-400 border-green-500/30', icon: CheckCircle2 },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: AlertTriangle },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: obras }, { data: orcamentoItens }, { data: cronogramas }, { data: bdis }, { data: profile }] =
    await Promise.all([
      supabase.from('obras').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('orcamento_itens').select('obra_id, quantidade, custo_unitario_aplicado, tipo'),
      supabase.from('cronograma').select('obra_id, status'),
      supabase.from('bdi_config').select('obra_id, bdi_total, impostos, margem_lucro, seguros, custos_indiretos'),
      user
        ? supabase.from('profiles').select('dashboard_layout').eq('id', user.id).single()
        : Promise.resolve({ data: null }),
    ])

  const obrasList = obras ?? []
  const bdiMap = new Map((bdis ?? []).map((b) => [b.obra_id, b]))

  let totalImpostos = 0, totalMargem = 0, totalSeguros = 0, totalCI = 0
  let totalMaterial = 0, totalMaoObra = 0

  const custosPorObra = new Map<string, number>()
  for (const item of orcamentoItens ?? []) {
    custosPorObra.set(item.obra_id, (custosPorObra.get(item.obra_id) ?? 0) + item.quantidade * item.custo_unitario_aplicado)
  }

  let totalVendaGeral = 0, totalCustoGeral = 0
  for (const obra of obrasList) {
    const custo = custosPorObra.get(obra.id) ?? 0
    const bdiConfig = bdiMap.get(obra.id)
    const bdi = bdiConfig?.bdi_total ?? 0
    const venda = calcBdiPrecoVenda(custo, bdi)
    totalVendaGeral += venda
    totalCustoGeral += custo
    if (bdiConfig) {
      totalImpostos += venda * (bdiConfig.impostos / 100)
      totalMargem += venda * (bdiConfig.margem_lucro / 100)
      totalSeguros += venda * (bdiConfig.seguros / 100)
      totalCI += venda * (bdiConfig.custos_indiretos / 100)
    }
  }

  const materialPorObra = new Map<string, number>()
  const maoPorObra = new Map<string, number>()
  for (const item of orcamentoItens ?? []) {
    const val = item.quantidade * item.custo_unitario_aplicado
    if ((item as any).tipo === 'MATERIAL') {
      materialPorObra.set(item.obra_id, (materialPorObra.get(item.obra_id) ?? 0) + val)
    } else {
      maoPorObra.set(item.obra_id, (maoPorObra.get(item.obra_id) ?? 0) + val)
    }
  }
  for (const obra of obrasList) {
    totalMaterial += materialPorObra.get(obra.id) ?? 0
    totalMaoObra += maoPorObra.get(obra.id) ?? 0
  }

  const nBdi = (bdis ?? []).length
  const mediaCI = nBdi > 0 ? (bdis ?? []).reduce((a, b) => a + b.custos_indiretos, 0) / nBdi : 0
  const mediaSeguros = nBdi > 0 ? (bdis ?? []).reduce((a, b) => a + b.seguros, 0) / nBdi : 0
  const mediaMargem = nBdi > 0 ? (bdis ?? []).reduce((a, b) => a + b.margem_lucro, 0) / nBdi : 0
  const mediaImpostos = nBdi > 0 ? (bdis ?? []).reduce((a, b) => a + b.impostos, 0) / nBdi : 0

  const roi = totalCustoGeral > 0 ? ((totalVendaGeral - totalCustoGeral) / totalCustoGeral) * 100 : 0
  const obrasAtivas = obrasList.filter((o) => o.status === 'EM_ANDAMENTO').length
  const totalObras = obrasList.length
  const totalTarefas = (cronogramas ?? []).length
  const tarefasConcluidas = (cronogramas ?? []).filter((c) => c.status === 'CONCLUIDA').length
  const idp = totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0

  const pctMaterial = totalCustoGeral > 0 ? (totalMaterial / totalCustoGeral) * 100 : 0
  const pctMaoObra = totalCustoGeral > 0 ? (totalMaoObra / totalCustoGeral) * 100 : 0
  const pctCI = totalVendaGeral > 0 ? (totalCI / totalVendaGeral) * 100 : 0
  const pctSeguros = totalVendaGeral > 0 ? (totalSeguros / totalVendaGeral) * 100 : 0
  const pctMargem = totalVendaGeral > 0 ? (totalMargem / totalVendaGeral) * 100 : 0
  const pctImpostos = totalVendaGeral > 0 ? (totalImpostos / totalVendaGeral) * 100 : 0

  let obraMaisLucrativa: { nome: string; margem: number } | null = null
  for (const obra of obrasList) {
    const custo = custosPorObra.get(obra.id) ?? 0
    const bdi = bdiMap.get(obra.id)?.bdi_total ?? 0
    const margem = calcBdiPrecoVenda(custo, bdi) - custo
    if (!obraMaisLucrativa || margem > obraMaisLucrativa.margem) obraMaisLucrativa = { nome: obra.nome, margem }
  }

  const obrasSemOrcamento = obrasList.filter((o) => !(custosPorObra.get(o.id) ?? 0)).length

  let maiorVendaObra = 0
  for (const obra of obrasList) {
    const custo = custosPorObra.get(obra.id) ?? 0
    const bdi = bdiMap.get(obra.id)?.bdi_total ?? 0
    const v = calcBdiPrecoVenda(custo, bdi)
    if (v > maiorVendaObra) maiorVendaObra = v
  }
  const concentracaoPortfolio = totalVendaGeral > 0 ? (maiorVendaObra / totalVendaGeral) * 100 : 0
  const percMaterial = totalCustoGeral > 0 ? (totalMaterial / totalCustoGeral) * 100 : 0
  const percMaoObra = totalCustoGeral > 0 ? (totalMaoObra / totalCustoGeral) * 100 : 0
  const obrasComTarefas = new Set((cronogramas ?? []).map((c) => c.obra_id))
  const obrasAndamentoSemTarefas = obrasList.filter((o) => o.status === 'EM_ANDAMENTO' && !obrasComTarefas.has(o.id)).length
  const custoMedioPorObra = totalObras > 0 ? totalCustoGeral / totalObras : 0

  const statusCount = Object.entries(STATUS_CONFIG).map(([status, cfg]) => ({
    name: cfg.label,
    value: obrasList.filter((o) => o.status === status).length,
  }))

  const obrasBars = obrasList.slice(0, 6).map((o) => {
    const custo = custosPorObra.get(o.id) ?? 0
    const bdi = bdiMap.get(o.id)?.bdi_total ?? 0
    return { name: o.nome.length > 18 ? o.nome.slice(0, 18) + '…' : o.nome, custo: calcBdiPrecoVenda(custo, bdi) }
  })

  const initialOrder = parseDashboardLayout(profile?.dashboard_layout)

  // ── Blocos pre-renderizados pelo Server Component ──────────────────────────

  const kpisBlock = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[
        { title: 'Total de Obras', value: totalObras.toString(), sub: `${obrasAtivas} em andamento`, icon: HardHat, color: 'text-primary', bg: 'bg-primary/10' },
        { title: 'Orçamento Total', value: formatCurrency(totalVendaGeral), sub: 'Preço de venda acumulado', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
        { title: 'ROI Médio', value: `${roi.toFixed(1)}%`, sub: 'Margem sobre o custo', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { title: 'IDP — Prazo', value: `${idp.toFixed(0)}%`, sub: `${tarefasConcluidas} de ${totalTarefas} tarefas`, icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
      ].map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card key={kpi.title} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <div className={`p-2 rounded-lg ${kpi.bg}`}><Icon className={`w-4 h-4 ${kpi.color}`} /></div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  const chartsBlock = <DashboardCharts statusData={statusCount} obrasData={obrasBars} />

  const composicaoBlock = obrasList.length > 0 ? (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Composição Geral dos Orçamentos</h2>
        <ComposicaoModal
          totalMaterial={totalMaterial} totalMaoObra={totalMaoObra} totalCustoGeral={totalCustoGeral}
          totalCI={totalCI} totalSeguros={totalSeguros} totalMargem={totalMargem}
          totalImpostos={totalImpostos} totalVendaGeral={totalVendaGeral}
          mediaCI={mediaCI} mediaSeguros={mediaSeguros} mediaMargem={mediaMargem} mediaImpostos={mediaImpostos}
        />
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Material', value: totalMaterial, pct: `${pctMaterial.toFixed(1)}% do custo direto`, c: '' },
          { label: 'Mão de Obra', value: totalMaoObra, pct: `${pctMaoObra.toFixed(1)}% do custo direto`, c: '' },
          { label: 'Custos Indiretos', value: totalCI, pct: `${pctCI.toFixed(1)}% do preço de venda`, c: '' },
          { label: 'Seguros', value: totalSeguros, pct: `${pctSeguros.toFixed(1)}% do preço de venda`, c: '' },
          { label: 'Margem de Lucro', value: totalMargem, pct: `${pctMargem.toFixed(1)}% do preço de venda`, c: 'text-green-500' },
          { label: 'Impostos', value: totalImpostos, pct: `${pctImpostos.toFixed(1)}% do preço de venda`, c: 'text-yellow-500' },
        ].map((item) => (
          <Card key={item.label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className={`text-lg font-bold ${item.c}`}>{formatCurrency(item.value)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.pct}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  ) : null

  const insightsBlock = (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Insights</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-md bg-yellow-500/10"><Trophy className="w-4 h-4 text-yellow-500" /></div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Obra Mais Lucrativa</p></div>
            {obraMaisLucrativa ? (<><p className="text-base font-semibold leading-snug line-clamp-1">{obraMaisLucrativa.nome}</p><p className="text-sm font-bold text-green-500 mt-1">{formatCurrency(obraMaisLucrativa.margem)}</p><p className="text-xs text-muted-foreground mt-0.5">Margem bruta estimada</p></>) : <p className="text-sm text-muted-foreground">Sem dados</p>}
          </CardContent>
        </Card>
        <Card className={`border-border/60 ${obrasSemOrcamento > 0 ? 'border-yellow-500/40' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><div className={`p-1.5 rounded-md ${obrasSemOrcamento > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}><AlertTriangle className={`w-4 h-4 ${obrasSemOrcamento > 0 ? 'text-yellow-500' : 'text-green-500'}`} /></div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Obras Sem Orçamento</p></div>
            <p className={`text-2xl font-bold ${obrasSemOrcamento > 0 ? 'text-yellow-500' : 'text-green-500'}`}>{obrasSemOrcamento}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{obrasSemOrcamento > 0 ? 'Obras sem itens de orçamento' : 'Todas as obras têm orçamento'}</p>
          </CardContent>
        </Card>
        <Card className={`border-border/60 ${concentracaoPortfolio > 50 ? 'border-orange-500/40' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><div className={`p-1.5 rounded-md ${concentracaoPortfolio > 50 ? 'bg-orange-500/10' : 'bg-blue-500/10'}`}><Target className={`w-4 h-4 ${concentracaoPortfolio > 50 ? 'text-orange-500' : 'text-blue-400'}`} /></div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Concentração de Portfólio</p></div>
            <p className={`text-2xl font-bold ${concentracaoPortfolio > 50 ? 'text-orange-500' : 'text-blue-400'}`}>{concentracaoPortfolio.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">{concentracaoPortfolio > 50 ? 'Alta dependência de 1 obra' : 'Portfólio bem distribuído'}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-md bg-purple-500/10"><Layers className="w-4 h-4 text-purple-400" /></div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Material vs Mão de Obra</p></div>
            <div className="flex items-end gap-3 mt-1">
              <div><p className="text-lg font-bold">{percMaterial.toFixed(1)}%</p><p className="text-xs text-muted-foreground">Material</p></div>
              <div className="text-muted-foreground/40 text-sm mb-1">vs</div>
              <div><p className="text-lg font-bold">{percMaoObra.toFixed(1)}%</p><p className="text-xs text-muted-foreground">Mão de Obra</p></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Proporção sobre o custo direto total</p>
          </CardContent>
        </Card>
        <Card className={`border-border/60 ${obrasAndamentoSemTarefas > 0 ? 'border-red-500/40' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><div className={`p-1.5 rounded-md ${obrasAndamentoSemTarefas > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}><ClipboardX className={`w-4 h-4 ${obrasAndamentoSemTarefas > 0 ? 'text-red-400' : 'text-green-500'}`} /></div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Em Andamento Sem Cronograma</p></div>
            <p className={`text-2xl font-bold ${obrasAndamentoSemTarefas > 0 ? 'text-red-400' : 'text-green-500'}`}>{obrasAndamentoSemTarefas}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{obrasAndamentoSemTarefas > 0 ? 'Obras ativas sem tarefas definidas' : 'Todas com cronograma configurado'}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-md bg-cyan-500/10"><Calculator className="w-4 h-4 text-cyan-400" /></div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Custo Médio por Obra</p></div>
            <p className="text-xl font-bold text-cyan-400">{formatCurrency(custoMedioPorObra)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Custo direto médio acumulado</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <DashboardCustomizer
      initialOrder={initialOrder}
      userId={user?.id ?? ''}
      kpis={kpisBlock}
      charts={chartsBlock}
      composicao={composicaoBlock}
      insights={insightsBlock}
    />
  )
}
