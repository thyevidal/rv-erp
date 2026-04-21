'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { HardHat, RotateCcw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import PermDeleteDialog from '@/components/obras/PermDeleteDialog'
import type { Obra } from '@/types'

export default function LixeiraCard({ obra }: { obra: Obra }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleRestore() {
    const { error } = await supabase
      .from('obras')
      .update({ deleted_at: null })
      .eq('id', obra.id)
    
    if (error) { toast.error('Erro ao restaurar: ' + error.message); return }
    toast.success('Obra restaurada com sucesso')
    router.refresh()
  }

  return (
    <Card className="h-full border-border/60 opacity-80 hover:opacity-100 transition-all bg-muted/20">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-muted p-2 rounded-md shrink-0">
            <HardHat className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-base leading-snug line-clamp-2">{obra.nome}</h2>
            {obra.deleted_at && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Excluída em {formatDate(obra.deleted_at)}
              </p>
            )}
          </div>
        </div>

        <div className="border-t pt-4 mt-auto flex items-center justify-between">
          <button
            onClick={handleRestore}
            className="text-xs font-semibold flex items-center gap-1.5 text-blue-500 hover:text-blue-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar
          </button>
          
          <PermDeleteDialog obra={obra} />
        </div>
      </CardContent>
    </Card>
  )
}
