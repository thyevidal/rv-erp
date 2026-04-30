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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PLANEJAMENTO: { label: 'Planejamento', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Clock },
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-primary/15 text-primary border-primary/30', icon: Activity },
  PAUSADA: { label: 'Pausada', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: PauseCircle },
  CONCLUIDA: { label: 'Concluída', color: 'bg-green-500/15 text-green-400 border-green-500/30', icon: CheckCircle2 },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: AlertTriangle },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: obras }, { data: orcamentoItens }, { data: cronogramas }, { data: bdis }] =
    await Promise.all([
      supabase.from('obras').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('orcamento_itens').select('obra_id, quantidade, custo_unitario_aplicado, tipo'),
      supabase.from('cronograma').select('obra_id, status'),
      supabase.from('bdi_config').select('obra_id, bdi_total, impostos, margem_lucro, seguros, custos_indiretos'),
    ])

  const obrasList = obras ?? []
  const bdiMap = new Map((bdis ?? []).map((b) => [b.obra_id, b]))

  // Composição geral — soma nominal de cada componente
  let totalImpostos = 0
  let totalMargem = 0
  let totalSeguros = 0
  let totalCI = 0
  let totalMaterial = 0
  let totalMaoObra = 0

  // Calcula custo direto e valor de venda por obra
  const custosPorObra = new Map<string, number>()
  for (const item of orcamentoItens ?? []) {
    const atual = custosPorObra.get(item.obra_id) ?? 0
    custosPorObra.set(item.obra_id, atual + item.quantidade * item.custo_unitario_aplicado)
  }

  // Total de venda = soma de cada obra com seu próprio BDI
  let totalVendaGeral = 0
  let totalCustoGeral = 0
  for (const obra of obrasList) {
    const custo = custosPorObra.get(obra.id) ?? 0
    const bdiConfig = bdiMap.get(obra.id)
    const bdiTotal = bdiConfig?.bdi_total ?? 0
    const venda = calcBdiPrecoVenda(custo, bdiTotal)
    totalVendaGeral += venda
    totalCustoGeral += custo

    // Composição nominal de cada obra
    if (bdiConfig) {
      totalImpostos += venda * (bdiConfig.impostos / 100)
      totalMargem += venda * (bdiConfig.margem_lucro / 100)
      totalSeguros += venda * (bdiConfig.seguros / 100)
      totalCI += venda * (bdiConfig.custos_indiretos / 100)
    }
  }

  // Custo material e MO por obra
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

  // Médias percentuais dos BDIs
  const nObrasComBdi = (bdis ?? []).length
  const mediaImpostos = nObrasComBdi > 0 ? (bdis ?? []).reduce((a, b) => a + b.impostos, 0) / nObrasComBdi : 0
  const mediaMargem = nObrasComBdi > 0 ? (bdis ?? []).reduce((a, b) => a + b.margem_lucro, 0) / nObrasComBdi : 0
  const mediaSeguros = nObrasComBdi > 0 ? (bdis ?? []).reduce((a, b) => a + b.seguros, 0) / nObrasComBdi : 0
  const mediaCI = nObrasComBdi > 0 ? (bdis ?? []).reduce((a, b) => a + b.custos_indiretos, 0) / nObrasComBdi : 0

  const roi = totalCustoGeral > 0
    ? ((totalVendaGeral - totalCustoGeral) / totalCustoGeral) * 100
    : 0

  const obrasAtivas = obrasList.filter((o) => o.status === 'EM_ANDAMENTO').length
  const totalObras = obrasList.length

  const totalTarefas = (cronogramas ?? []).length
  const tarefasConcluidas = (cronogramas ?? []).filter((c) => c.status === 'CONCLUIDA').length
  const idp = totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0

  const kpis = [
    {
      title: 'Total de Obras',
      value: totalObras.toString(),
      sub: `${obrasAtivas} em andamento`,
      icon: HardHat,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Orçamento Total',
      value: formatCurrency(totalVendaGeral),
      sub: 'Preço de venda acumulado',
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'ROI Médio',
      value: `${roi.toFixed(1)}%`,
      sub: 'Margem sobre o custo',
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      title: 'IDP — Prazo',
      value: `${idp.toFixed(0)}%`,
      sub: `${tarefasConcluidas} de ${totalTarefas} tarefas`,
      icon: Activity,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
  ]

  // Percentuais ponderados pelo valor de venda (mais precisos que a média simples)
  const pctMaterial = totalCustoGeral > 0 ? (totalMaterial / totalCustoGeral) * 100 : 0
  const pctMaoObra = totalCustoGeral > 0 ? (totalMaoObra / totalCustoGeral) * 100 : 0
  const pctCI = totalVendaGeral > 0 ? (totalCI / totalVendaGeral) * 100 : 0
  const pctSeguros = totalVendaGeral > 0 ? (totalSeguros / totalVendaGeral) * 100 : 0
  const pctMargem = totalVendaGeral > 0 ? (totalMargem / totalVendaGeral) * 100 : 0
  const pctImpostos = totalVendaGeral > 0 ? (totalImpostos / totalVendaGeral) * 100 : 0

  // Insight 1: obra mais lucrativa
  let obraMaisLucrativa: { nome: string; margem: number } | null = null
  for (const obra of obrasList) {
    const custo = custosPorObra.get(obra.id) ?? 0
    const bdiCfg = bdiMap.get(obra.id)
    const bdi = bdiCfg?.bdi_total ?? 0
    const venda = calcBdiPrecoVenda(custo, bdi)
    const margem = venda - custo
    if (!obraMaisLucrativa || margem > obraMaisLucrativa.margem) {
      obraMaisLucrativa = { nome: obra.nome, margem }
    }
  }

  // Insight 2: obras sem orçamento
  const obrasSemOrcamento = obrasList.filter((o) => !(custosPorObra.get(o.id) ?? 0)).length

  // Insight 3: concentração de portfólio
  let maiorVendaObra = 0
  for (const obra of obrasList) {
    const custo = custosPorObra.get(obra.id) ?? 0
    const bdiCfg = bdiMap.get(obra.id)
    const bdi = bdiCfg?.bdi_total ?? 0
    const venda = calcBdiPrecoVenda(custo, bdi)
    if (venda > maiorVendaObra) maiorVendaObra = venda
  }
  const concentracaoPortfolio = totalVendaGeral > 0 ? (maiorVendaObra / totalVendaGeral) * 100 : 0

  // Insight 4: % material vs % mão de obra sobre custo direto
  const percMaterial = totalCustoGeral > 0 ? (totalMaterial / totalCustoGeral) * 100 : 0
  const percMaoObra = totalCustoGeral > 0 ? (totalMaoObra / totalCustoGeral) * 100 : 0

  // Insight 5: obras EM_ANDAMENTO sem tarefas no cronograma
  const obrasComTarefas = new Set((cronogramas ?? []).map((c) => c.obra_id))
  const obrasAndamentoSemTarefas = obrasList.filter(
    (o) => o.status === 'EM_ANDAMENTO' && !obrasComTarefas.has(o.id),
  ).length

  // Insight 6: custo direto médio por obra
  const custoMedioPorObra = totalObras > 0 ? totalCustoGeral / totalObras : 0

  const statusCount = Object.entries(STATUS_CONFIG).map(([status, cfg]) => ({
    name: cfg.label,
    value: obrasList.filter((o) => o.status === status).length,
  }))

  const obrasBars = obrasList.slice(0, 6).map((o) => {
    const custo = custosPorObra.get(o.id) ?? 0
    const bdiC = bdiMap.get(o.id)
    const bdi = bdiC?.bdi_total ?? 0
    return {
      name: o.nome.length > 18 ? o.nome.slice(0, 18) + '…' : o.nome,
      custo: calcBdiPrecoVenda(custo, bdi),
    }
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-0.5">Visão geral das obras e indicadores do sistema.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>



      <DashboardCharts statusData={statusCount} obrasData={obrasBars} />

      {/* Composição Geral */}
      {obrasList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Composição Geral dos Orçamentos</h2>
            <ComposicaoModal
              totalMaterial={totalMaterial}
              totalMaoObra={totalMaoObra}
              totalCustoGeral={totalCustoGeral}
              totalCI={totalCI}
              totalSeguros={totalSeguros}
              totalMargem={totalMargem}
              totalImpostos={totalImpostos}
              totalVendaGeral={totalVendaGeral}
              mediaCI={mediaCI}
              mediaSeguros={mediaSeguros}
              mediaMargem={mediaMargem}
              mediaImpostos={mediaImpostos}
            />
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Material</p>
                <p className="text-lg font-bold">{formatCurrency(totalMaterial)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pctMaterial.toFixed(1)}% do custo direto</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Mão de Obra</p>
                <p className="text-lg font-bold">{formatCurrency(totalMaoObra)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pctMaoObra.toFixed(1)}% do custo direto</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Custos Indiretos</p>
                <p className="text-lg font-bold">{formatCurrency(totalCI)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pctCI.toFixed(1)}% do preço de venda</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Seguros</p>
                <p className="text-lg font-bold">{formatCurrency(totalSeguros)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pctSeguros.toFixed(1)}% do preço de venda</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Margem de Lucro</p>
                <p className="text-lg font-bold text-green-500">{formatCurrency(totalMargem)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pctMargem.toFixed(1)}% do preço de venda</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Impostos</p>
                <p className="text-lg font-bold text-yellow-500">{formatCurrency(totalImpostos)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pctImpostos.toFixed(1)}% do preço de venda</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Insights</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

          {/* Obra Mais Lucrativa */}
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-yellow-500/10">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Obra Mais Lucrativa</p>
              </div>
              {obraMaisLucrativa ? (
                <>
                  <p className="text-base font-semibold leading-snug line-clamp-1">{obraMaisLucrativa.nome}</p>
                  <p className="text-sm font-bold text-green-500 mt-1">{formatCurrency(obraMaisLucrativa.margem)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Margem bruta estimada</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados suficientes</p>
              )}
            </CardContent>
          </Card>

          {/* Obras Sem Orçamento */}
          <Card className={`border-border/60 ${obrasSemOrcamento > 0 ? 'border-yellow-500/40' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-md ${obrasSemOrcamento > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                  <AlertTriangle className={`w-4 h-4 ${obrasSemOrcamento > 0 ? 'text-yellow-500' : 'text-green-500'}`} />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Obras Sem Orçamento</p>
              </div>
              <p className={`text-2xl font-bold ${obrasSemOrcamento > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                {obrasSemOrcamento}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {obrasSemOrcamento > 0 ? 'Obras sem itens de orçamento' : 'Todas as obras têm orçamento'}
              </p>
            </CardContent>
          </Card>

          {/* Concentração de Portfólio */}
          <Card className={`border-border/60 ${concentracaoPortfolio > 50 ? 'border-orange-500/40' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-md ${concentracaoPortfolio > 50 ? 'bg-orange-500/10' : 'bg-blue-500/10'}`}>
                  <Target className={`w-4 h-4 ${concentracaoPortfolio > 50 ? 'text-orange-500' : 'text-blue-400'}`} />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Concentração de Portfólio</p>
              </div>
              <p className={`text-2xl font-bold ${concentracaoPortfolio > 50 ? 'text-orange-500' : 'text-blue-400'}`}>
                {concentracaoPortfolio.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {concentracaoPortfolio > 50 ? 'Alta dependência de 1 obra' : 'Portfólio bem distribuído'}
              </p>
            </CardContent>
          </Card>

          {/* Relação Material vs MO */}
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-purple-500/10">
                  <Layers className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Material vs Mão de Obra</p>
              </div>
              <div className="flex items-end gap-3 mt-1">
                <div>
                  <p className="text-lg font-bold">{percMaterial.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Material</p>
                </div>
                <div className="text-muted-foreground/40 text-sm mb-1">vs</div>
                <div>
                  <p className="text-lg font-bold">{percMaoObra.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Mão de Obra</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Proporção sobre o custo direto total</p>
            </CardContent>
          </Card>

          {/* Obras em Andamento Sem Cronograma */}
          <Card className={`border-border/60 ${obrasAndamentoSemTarefas > 0 ? 'border-red-500/40' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-md ${obrasAndamentoSemTarefas > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                  <ClipboardX className={`w-4 h-4 ${obrasAndamentoSemTarefas > 0 ? 'text-red-400' : 'text-green-500'}`} />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Em Andamento Sem Cronograma</p>
              </div>
              <p className={`text-2xl font-bold ${obrasAndamentoSemTarefas > 0 ? 'text-red-400' : 'text-green-500'}`}>
                {obrasAndamentoSemTarefas}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {obrasAndamentoSemTarefas > 0 ? 'Obras ativas sem tarefas definidas' : 'Todas com cronograma configurado'}
              </p>
            </CardContent>
          </Card>

          {/* Custo Médio por Obra */}
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-cyan-500/10">
                  <Calculator className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Custo Médio por Obra</p>
              </div>
              <p className="text-xl font-bold text-cyan-400">{formatCurrency(custoMedioPorObra)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Custo direto médio acumulado</p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}