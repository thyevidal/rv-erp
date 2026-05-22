import { createClient } from '@/lib/supabase/server'
import EstoqueClient from './EstoqueClient'
import { getOrgPlan } from '@/lib/plan'
import PlanGate from '@/components/PlanGate'

export default async function EstoquePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const orgId: string = profile?.organization_id ?? ''

  const planInfo = await getOrgPlan(orgId)
  if (planInfo.isFree) {
    return <PlanGate allowed={false} feature="Estoque" />
  }

  const [{ data: itens }, { data: movimentacoes }, { data: obras }] = await Promise.all([
    supabase
      .from('estoque_itens')
      .select('*')
      .eq('organization_id', orgId)
      .order('nome'),
    supabase
      .from('estoque_movimentacoes')
      .select('*, obras(nome)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false }),
    supabase
      .from('obras')
      .select('id, nome')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .order('nome'),
  ])

  return (
    <EstoqueClient
      itens={itens ?? []}
      movimentacoes={movimentacoes ?? []}
      obras={obras ?? []}
      orgId={orgId}
    />
  )
}
