import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, calcBdiPrecoVenda } from '@/lib/utils'
import {
  HardHat, TrendingUp, DollarSign, Activity, AlertTriangle,
  CheckCircle2, Clock, PauseCircle
} from 'lucide-react'
import Link from 'next/link'
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
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Material</p>
                <p className="text-lg font-bold">{formatCurrency(totalMaterial)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Custo direto de materiais</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Mão de Obra</p>
                <p className="text-lg font-bold">{formatCurrency(totalMaoObra)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Custo direto de MO</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Custos Indiretos</p>
                <p className="text-lg font-bold">{formatCurrency(totalCI)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Média {mediaCI.toFixed(1)}% por obra</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Seguros</p>
                <p className="text-lg font-bold">{formatCurrency(totalSeguros)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Média {mediaSeguros.toFixed(1)}% por obra</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Margem de Lucro</p>
                <p className="text-lg font-bold text-green-500">{formatCurrency(totalMargem)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Média {mediaMargem.toFixed(1)}% por obra</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Impostos</p>
                <p className="text-lg font-bold text-yellow-500">{formatCurrency(totalImpostos)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Média {mediaImpostos.toFixed(1)}% por obra</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Obras Recentes</h2>
        {obrasList.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <HardHat className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-muted-foreground">Nenhuma obra cadastrada</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Crie sua primeira obra no menu <strong>Obras</strong>.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {obrasList.slice(0, 6).map((obra) => {
              const cfg = STATUS_CONFIG[obra.status] ?? STATUS_CONFIG.PLANEJAMENTO
              const StatusIcon = cfg.icon
              const custo = custosPorObra.get(obra.id) ?? 0
              const bdiCfg = bdiMap.get(obra.id)
              const bdi = bdiCfg?.bdi_total ?? 0
              const venda = calcBdiPrecoVenda(custo, bdi)
              return (
                <Link key={obra.id} href={`/dashboard/obras/${obra.id}`}>
                  <Card className="border-border/60 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold leading-snug">{obra.nome}</CardTitle>
                        <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                      {obra.endereco && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{obra.endereco}</p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-between items-center text-sm border-t pt-3">
                        <span className="text-muted-foreground">Preço de Venda</span>
                        <span className="font-semibold text-foreground">{formatCurrency(venda)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}