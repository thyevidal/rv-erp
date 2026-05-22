'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Plan {
  id: string
  nome: string
}

interface Props {
  orgId: string
  currentPlanId: string | null
  plans: Plan[]
}

export default function OrgPlanChanger({ orgId, currentPlanId, plans }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(currentPlanId ?? '')

  async function handleChange(planId: string) {
    setSelected(planId)
    setLoading(true)
    const { error } = await supabase
      .from('subscriptions')
      .update({ plan_id: planId, status: 'ATIVA' })
      .eq('organization_id', orgId)
    setLoading(false)
    if (error) {
      toast.error('Erro ao alterar plano: ' + error.message)
    } else {
      toast.success('Plano atualizado!')
    }
  }

  return (
    <select
      value={selected}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className="text-xs border border-border/60 rounded-md px-2 py-1 bg-background text-foreground disabled:opacity-50"
    >
      <option value="">— sem plano —</option>
      {plans.map((p) => (
        <option key={p.id} value={p.id}>{p.nome}</option>
      ))}
    </select>
  )
}
