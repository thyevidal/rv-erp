'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type PlanStatus = { isPro: boolean; isFree: boolean; canCreateObra: boolean; loading: boolean }

export function usePlan(): PlanStatus {
  const [status, setStatus] = useState<PlanStatus>({ isPro: false, isFree: true, canCreateObra: true, loading: true })
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus(s => ({ ...s, loading: false })); return }
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
      if (!profile?.organization_id) { setStatus(s => ({ ...s, loading: false })); return }

      const [{ data: sub }, { data: obras }] = await Promise.all([
        supabase.from('subscriptions').select('*, plans(preco_mensal, max_obras)').eq('organization_id', profile.organization_id).single(),
        supabase.from('obras').select('id').eq('organization_id', profile.organization_id).is('deleted_at', null),
      ])
      const plan = (sub as any)?.plans
      const preco = plan?.preco_mensal ?? 0
      const maxObras = plan?.max_obras ?? 1
      const obrasCount = obras?.length ?? 0
      const isPro = preco > 0 || maxObras === -1
      setStatus({ isPro, isFree: !isPro, canCreateObra: maxObras === -1 || obrasCount < maxObras, loading: false })
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return status
}
