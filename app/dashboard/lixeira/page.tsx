import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2 } from 'lucide-react'
import LixeiraCard from '@/components/obras/LixeiraCard'

export default async function LixeiraPage() {
  const supabase = await createClient()
  
  // Buscar apenas obras DELETADAS (onde deleted_at não é nulo)
  const { data: obras } = await supabase
    .from('obras')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  const obrasList = obras ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-destructive flex items-center gap-2">
            <Trash2 className="w-6 h-6" />
            Lixeira
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {obrasList.length} {obrasList.length === 1 ? 'obra arquivada' : 'obras arquivadas'} prontas para exclusão permanente.
          </p>
        </div>
      </div>

      {obrasList.length === 0 ? (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trash2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-muted-foreground">A lixeira está vazia</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Obras excluídas aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {obrasList.map((obra) => (
            <LixeiraCard key={obra.id} obra={obra} />
          ))}
        </div>
      )}
    </div>
  )
}
