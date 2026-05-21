'use client'

import { useState, useCallback } from 'react'
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

export type BlockId = 'kpis' | 'charts' | 'composicao' | 'insights'

const BLOCK_LABELS: Record<BlockId, string> = {
  kpis: 'KPIs — Indicadores principais',
  charts: 'Gráficos',
  composicao: 'Composição Geral dos Orçamentos',
  insights: 'Insights',
}

const DEFAULT_ORDER: BlockId[] = ['kpis', 'charts', 'composicao', 'insights']

interface Props {
  initialOrder: BlockId[]
  userId: string
  children: (order: BlockId[]) => React.ReactNode
}

function SortableBlock({ id, editing }: { id: BlockId; editing: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (!editing) return null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-card border border-border/60 rounded-lg cursor-default select-none',
        isDragging ? 'opacity-50 shadow-lg z-50' : '',
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

export function parseDashboardLayout(raw: unknown): BlockId[] {
  if (!Array.isArray(raw)) return DEFAULT_ORDER
  const valid = raw.filter((x): x is BlockId => typeof x === 'string' && x in BLOCK_LABELS)
  // Garante que todos os blocos existam (adiciona faltantes no fim)
  const missing = DEFAULT_ORDER.filter((b) => !valid.includes(b))
  return [...valid, ...missing]
}

export default function DashboardCustomizer({ initialOrder, userId, children }: Props) {
  const supabase = createClient()
  const [order, setOrder] = useState<BlockId[]>(initialOrder)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

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
    const { error } = await supabase
      .from('profiles')
      .update({ dashboard_layout: order })
      .eq('id', userId)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar layout'); return }
    toast.success('Layout salvo!')
    setEditing(false)
  }

  return (
    <div className="space-y-8">
      {/* Barra de personalização */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-0.5">Visão geral das obras e indicadores do sistema.</p>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5" />
            Personalizar
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

      {/* Modo edição: lista arrastável */}
      {editing && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-medium text-primary">
            Arraste os blocos para reorganizar a dashboard
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {order.map((id) => (
                  <SortableBlock key={id} id={id} editing={editing} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Renderiza os blocos na ordem atual */}
      {children(order)}
    </div>
  )
}
