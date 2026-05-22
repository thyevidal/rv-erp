import { createClient } from '@/lib/supabase/server'

export type PlanFeatures = {
  banco_insumos: boolean
  agenda: boolean
  financeiro_org: boolean
  estoque: boolean
  aquisicao_construcao: boolean
  relatorio_pdf: boolean
  multiplos_membros: boolean
}

export type PlanInfo = {
  plan_id: string | null
  nome: string
  preco_mensal: number
  max_obras: number
  isPro: boolean
  isFree: boolean
  obrasCount: number
  canCreateObra: boolean
  features: PlanFeatures
}

export async function getOrgPlan(orgId: string): Promise<PlanInfo> {
  const supabase = await createClient()
  const [{ data: sub }, { data: obras }] = await Promise.all([
    supabase.from('subscriptions').select('*, plans(*)').eq('organization_id', orgId).single(),
    supabase.from('obras').select('id').eq('organization_id', orgId).is('deleted_at', null),
  ])
  const plan = (sub as any)?.plans
  const nome = plan?.nome ?? 'Gratuito'
  const preco_mensal = plan?.preco_mensal ?? 0
  const max_obras = plan?.max_obras ?? 1
  const obrasCount = obras?.length ?? 0
  const isPro = preco_mensal > 0 || max_obras === -1
  const isFree = !isPro
  const canCreateObra = max_obras === -1 || obrasCount < max_obras

  const rawFeatures = plan?.features ?? {}
  const features: PlanFeatures = {
    banco_insumos: rawFeatures.banco_insumos ?? isPro,
    agenda: rawFeatures.agenda ?? isPro,
    financeiro_org: rawFeatures.financeiro_org ?? isPro,
    estoque: rawFeatures.estoque ?? isPro,
    aquisicao_construcao: rawFeatures.aquisicao_construcao ?? isPro,
    relatorio_pdf: rawFeatures.relatorio_pdf ?? isPro,
    multiplos_membros: rawFeatures.multiplos_membros ?? isPro,
  }

  return { plan_id: sub?.plan_id ?? null, nome, preco_mensal, max_obras, isPro, isFree, obrasCount, canCreateObra, features }
}
