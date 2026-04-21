'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import EditObraDialog from '@/components/obras/EditObraDialog'
import { toast } from 'sonner'
import type { Obra, ObraStatus } from '@/types'

const STATUS_OPTIONS: { value: ObraStatus; label: string; classes: string }[] = [
  { value: 'PLANEJAMENTO', label: 'Planejamento', classes: 'text-blue-400' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento', classes: 'text-primary' },
  { value: 'PAUSADA',      label: 'Pausada',      classes: 'text-yellow-400' },
  { value: 'CONCLUIDA',   label: 'Concluída',    classes: 'text-green-400' },
  { value: 'CANCELADA',   label: 'Cancelada',    classes: 'text-red-400' },
]

export default function ObraHeaderActions({ obra }: { obra: Obra }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleStatusChange(status: ObraStatus) {
    const { error } = await supabase
      .from('obras')
      .update({ status })
      .eq('id', obra.id)
    if (error) { toast.error('Erro ao atualizar status: ' + error.message); return }
    toast.success('Status atualizado!')
    router.refresh()
  }

  async function handleTrash() {
    if (!confirm('Deseja mover esta obra para a lixeira?')) return
    const { error } = await supabase
      .from('obras')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', obra.id)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Obra movida para a lixeira')
    router.push('/dashboard/obras')
    router.refresh()
  }

  if (obra.deleted_at) {
    return (
      <div className="flex items-center text-sm font-medium text-destructive bg-destructive/10 px-3 py-1.5 rounded-md border border-destructive/20">
        Obra Arquivada na Lixeira
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Select rápido de status */}
      <Select value={obra.status} onValueChange={(v) => handleStatusChange(v as ObraStatus)}>
        <SelectTrigger className="h-9 text-xs w-40 border-border/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className={opt.classes}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Botão editar completo */}
      <EditObraDialog obra={obra} />

      {/* Botão mover para lixeira */}
      <button
        onClick={handleTrash}
        title="Mover para lixeira"
        className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
        </svg>
      </button>
    </div>
  )
}


