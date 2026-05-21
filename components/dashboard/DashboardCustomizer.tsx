'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { type BlockId, BLOCK_LABELS, DEFAULT_ORDER } from '@/lib/dashboard-layout'

// Re-exporta para compatibilidade (sem executar no servidor)
export type { BlockId }

interface Props {
  initialOrder: BlockId[]
  userId: string
  // Blocos já renderizados pelo Server Component — passados como ReactNode (serializável)
  kpis: React.ReactNode
  charts: React.ReactNode
  composicao: React.ReactNode
  insights: React.ReactNode
}

function SortableRow({ id }: { id: BlockId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-card border border-border/60 rounded-lg select-none',
        isDragging && 'opacity-50 shadow-lg',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium">{BLOCK_LABELS[id]}</span>
    </div>
  )
}

export default function DashboardCustomizer({ initialOrder, userId, kpis, charts, composicao, insights }: Props) {
  const supabase = createClient()
  const [order, setOrder] = useState<BlockId[]>(initialOrder)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const blocks: Record<BlockId, React.ReactNode> = { kpis, charts, composicao, insights }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as BlockId)
        const newIndex = prev.indexOf(over.id as BlockId)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  async function saveLayout() {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ dashboard_layout: order }).eq('id', userId)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar layout'); return }
    toast.success('Layout salvo!')
    setEditing(false)
  }

  return (
    <div className="space-y-8">
      {/* Header com botão personalizar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-0.5">Visão geral das obras e indicadores do sistema.</p>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5" />Personalizar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setOrder(initialOrder); setEditing(false) }}>
              Cancelar
            </Button>
            <Button size="sm" className="gap-2" onClick={saveLayout} disabled={saving}>
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Salvando...' : 'Salvar ordem'}
            </Button>
          </div>
        )}
      </div>

      {/* Modo edição — lista arrastável */}
      {editing && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-medium text-primary">Arraste os blocos para reorganizar</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {order.map((id) => <SortableRow key={id} id={id} />)}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Blocos na ordem atual */}
      {order.map((id) => (
        <div key={id}>
          {blocks[id]}
        </div>
      ))}
    </div>
  )
}
