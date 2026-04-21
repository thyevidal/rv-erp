import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import {
  HardHat, TrendingUp, DollarSign, Activity, AlertTriangle,
  CheckCircle2, Clock, PauseCircle
} from 'lucide-react'
import Link from 'next/link'
import DashboardCharts from '@/components/dashboard/DashboardCharts'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PLANEJAMENTO: { label: 'Planejamento', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Clock },
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-primary/15 text-primary border-primary/30', icon: Activity },
  PAUSADA: { label: 'Pausada', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: PauseCircle },
  CONCLUIDA: { label: 'Concluída', color: 'bg-green-500/15 text-green-400 border-green-500/30', icon: CheckCircle2 },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: AlertTriangle },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: obras }, { data: orcamentoItens }, { data: cronogramas }, { data: estoqueTotal }] =
    await Promise.all([
      supabase.from('obras').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('orcamento_itens').select('obra_id, quantidade, custo_unitario_aplicado'),
      supabase.from('cronograma').select('obra_id, status'),
      supabase.from('estoque_logs').select('obra_id, quantidade_entregue'),
    ])

  const obrasList = obras ?? []

  // KPIs
  const obrasAtivas = obrasList.filter((o) => o.status === 'EM_ANDAMENTO').length
  const totalObras = obrasList.length

  const totalOrcamento = (orcamentoItens ?? []).reduce(
    (acc, item) => acc + item.quantidade * item.custo_unitario_aplicado, 0
  )

  const totalTarefas = (cronogramas ?? []).length
  const tarefasConcluidas = (cronogramas ?? []).filter((c) => c.status === 'CONCLUIDA').length
  const idp = totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0

  // ROI placeholder (custo → venda via BDI médio 25%)
  const bdiMedio = 0.25
  const totalVenda = totalOrcamento / (1 - bdiMedio)
  const roi = totalOrcamento > 0 ? ((totalVenda - totalOrcamento) / totalOrcamento) * 100 : 0

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
      value: formatCurrency(totalOrcamento),
      sub: 'Custo direto acumulado',
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

  // Dados para gráficos
  const statusCount = Object.entries(STATUS_CONFIG).map(([status, cfg]) => ({
    name: cfg.label,
    value: obrasList.filter((o) => o.status === status).length,
  }))

  const obrasBars = obrasList.slice(0, 6).map((o) => ({
    name: o.nome.length > 18 ? o.nome.slice(0, 18) + '…' : o.nome,
    custo: (orcamentoItens ?? [])
      .filter((i) => i.obra_id === o.id)
      .reduce((acc, i) => acc + i.quantidade * i.custo_unitario_aplicado, 0),
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-0.5">Visão geral das obras e indicadores do sistema.</p>
      </div>

      {/* KPI Cards */}
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

      {/* Charts */}
      <DashboardCharts statusData={statusCount} obrasData={obrasBars} />

      {/* Obras Recentes */}
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
              const custoObra = (orcamentoItens ?? [])
                .filter((i) => i.obra_id === obra.id)
                .reduce((acc, i) => acc + i.quantidade * i.custo_unitario_aplicado, 0)
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
                        <span className="text-muted-foreground">Orçamento</span>
                        <span className="font-semibold text-foreground">{formatCurrency(custoObra)}</span>
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
