import { createClient } from '@/lib/supabase/server'
import { getOrgPlan } from '@/lib/plan'
import PlanGate from '@/components/PlanGate'
import InsumosContent from './InsumosContent'

export default async function InsumosPage() {
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
    return <PlanGate allowed={false} feature="Banco de Insumos" />
  }

  return <InsumosContent />
}
