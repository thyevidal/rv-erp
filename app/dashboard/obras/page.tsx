import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { HardHat } from 'lucide-react'
import ObrasActions from '@/components/obras/ObrasActions'
import ObraCard from '@/components/obras/ObraCard'

export default async function ObrasPage() {
  const supabase = await createClient()
  const { data: obras } = await supabase
    .from('obras').select('*').is('deleted_at', null).order('created_at', { ascending: false })
  const { data: itens } = await supabase
    .from('orcamento_itens').select('obra_id, quantidade, custo_unitario_aplicado')

  const obrasList = obras ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Obras</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {obrasList.length} {obrasList.length === 1 ? 'obra cadastrada' : 'obras cadastradas'}
          </p>
        </div>
        <ObrasActions />
      </div>

      {obrasList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <HardHat className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-muted-foreground">Nenhuma obra cadastrada</p>
            <p className="text-sm text-muted-foreground/60 mt-1 mb-4">
              Clique em &quot;Nova Obra&quot; para começar
            </p>
            <ObrasActions primary />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {obrasList.map((obra) => {
            const custo = (itens ?? [])
              .filter((i) => i.obra_id === obra.id)
              .reduce((a, i) => a + i.quantidade * i.custo_unitario_aplicado, 0)
            return <ObraCard key={obra.id} obra={obra} custo={custo} />
          })}
        </div>
      )}
    </div>
  )
}
