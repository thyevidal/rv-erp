import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatCurrency, calcBdiPrecoVenda } from '@/lib/utils'
import { MapPin, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import OrcamentoTab from '@/components/obras/OrcamentoTab'
import CronogramaTab from '@/components/obras/CronogramaTab'
import CurvaABCTab from '@/components/obras/CurvaABCTab'
import MapaColetaTab from '@/components/obras/MapaColetaTab'
import EstoqueTab from '@/components/obras/EstoqueTab'
import FinanceiroTab from '@/components/obras/FinanceiroTab'
import ObraHeaderActions from '@/components/obras/ObraHeaderActions'

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  PLANEJAMENTO: { label: 'Planejamento', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  EM_ANDAMENTO: { label: 'Em Andamento', classes: 'bg-primary/10 text-primary border-primary/30' },
  PAUSADA: { label: 'Pausada', classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  CONCLUIDA: { label: 'Concluída', classes: 'bg-green-500/10 text-green-400 border-green-500/30' },
  CANCELADA: { label: 'Cancelada', classes: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

export default async function ObraDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('organization_id').eq('id', user!.id).single()

  const [{ data: obra }, { data: bdi }, { data: itens }, { data: cronos }, { data: coleta }, { data: estoque }, { data: lancamentos }] =
    await Promise.all([
      supabase.from('obras').select('*').eq('id', id).single(),
      supabase.from('bdi_config').select('*').eq('obra_id', id).maybeSingle(),
      supabase.from('orcamento_itens').select('*').eq('obra_id', id).order('etapa').order('created_at'),
      supabase.from('cronograma').select('*').eq('obra_id', id).order('data_prevista_inicio'),
      supabase.from('mapa_coleta').select('*').eq('obra_id', id),
      supabase.from('estoque_logs').select('*').eq('obra_id', id).order('data_entrega', { ascending: false }),
      supabase.from('financeiro_lancamentos').select('*').eq('obra_id', id).order('data', { ascending: false }),
    ])

  if (!obra) notFound()

  const cfg = STATUS_MAP[obra.status] ?? STATUS_MAP.PLANEJAMENTO
  const totalCusto = (itens ?? []).reduce((a, i) => a + i.quantidade * i.custo_unitario_aplicado, 0)
  const custoMaterial = (itens ?? []).filter((i) => i.tipo === 'MATERIAL').reduce((a, i) => a + i.quantidade * i.custo_unitario_aplicado, 0)
  const custoMaoObra = (itens ?? []).filter((i) => i.tipo === 'MAO_DE_OBRA').reduce((a, i) => a + i.quantidade * i.custo_unitario_aplicado, 0)
  const bdiTotal = bdi?.bdi_total ?? 0
  const totalVenda = calcBdiPrecoVenda(totalCusto, bdiTotal)

  return (
    <div className="space-y-6">
      <Link href="/dashboard/obras" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Obras
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{obra.nome}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.classes}`}>
              {cfg.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            {obra.endereco && (
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{obra.endereco}</span>
            )}
            {(obra.data_inicio || obra.data_fim) && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(obra.data_inicio)} → {formatDate(obra.data_fim)}
              </span>
            )}
            <span className="font-semibold text-foreground">Total: {formatCurrency(totalVenda)}</span>
          </div>
        </div>
        <ObraHeaderActions obra={obra} />
      </div>

      <Tabs defaultValue="orcamento" className="w-full">
        <div className="overflow-x-auto mb-6">
          <TabsList className="w-max">
            <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
            <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
            <TabsTrigger value="curva-abc">Curva ABC</TabsTrigger>
            <TabsTrigger value="mapa-coleta">Mapa de Coleta</TabsTrigger>
            <TabsTrigger value="estoque">Recebimento</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="orcamento">
          <OrcamentoTab obraId={id} itens={itens ?? []} bdi={bdi} />
        </TabsContent>
        <TabsContent value="cronograma">
          <CronogramaTab obraId={id} tarefas={cronos ?? []} />
        </TabsContent>
        <TabsContent value="curva-abc">
          <CurvaABCTab itens={itens ?? []} />
        </TabsContent>
        <TabsContent value="mapa-coleta">
          <MapaColetaTab obraId={id} itens={itens ?? []} coleta={coleta ?? []} />
        </TabsContent>
        <TabsContent value="estoque">
          <EstoqueTab obraId={id} itens={itens ?? []} logs={estoque ?? []} />
        </TabsContent>
        <TabsContent value="financeiro">
          <FinanceiroTab
            obraId={id}
            organizationId={profile?.organization_id ?? ''}
            lancamentos={lancamentos ?? []}
            totalPlanejado={totalVenda}
            custoPlanejado={totalCusto}
            custoMaterial={custoMaterial}
            custoMaoObra={custoMaoObra}
            bdi={bdi}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}