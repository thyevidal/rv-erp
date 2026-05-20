import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils'

export default async function AdminOrganizacoesPage() {
  const admin = createAdminClient()

  const [{ data: orgs }, { data: subs }, { data: obras }] = await Promise.all([
    admin.from('organizations').select('*').order('created_at', { ascending: false }),
    admin.from('subscriptions').select('*, plans(nome, max_obras, preco_mensal)'),
    admin.from('obras').select('organization_id').is('deleted_at', null),
  ])

  const subMap = new Map((subs ?? []).map((s) => [s.organization_id, s]))
  const obrasCount = (obras ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.organization_id] = (acc[o.organization_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organizações</h1>
        <p className="text-muted-foreground text-sm mt-1">{orgs?.length ?? 0} organizações cadastradas.</p>
      </div>

      <div className="border border-border/60 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left text-muted-foreground text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Organização</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Obras</th>
              <th className="px-4 py-3 font-medium text-right">Limite</th>
              <th className="px-4 py-3 font-medium">Desde</th>
            </tr>
          </thead>
          <tbody>
            {(orgs ?? []).map((org) => {
              const sub = subMap.get(org.id)
              const plan = (sub as any)?.plans
              const count = obrasCount[org.id] ?? 0
              const max = plan?.max_obras ?? 1
              const atLimit = max !== -1 && count >= max
              return (
                <tr key={org.id} className="border-t border-border/60 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{org.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {plan?.nome ?? '—'}
                    {plan?.preco_mensal > 0 && (
                      <span className="ml-1 text-xs">({formatCurrency(plan.preco_mensal)}/mês)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                      sub?.status === 'ATIVA' ? 'bg-green-500/10 text-green-600 border-green-500/30'
                        : sub?.status === 'TRIAL' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                        : 'bg-red-500/10 text-red-500 border-red-500/30'
                    }`}>
                      {sub?.status ?? 'SEM PLANO'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${atLimit ? 'text-destructive' : ''}`}>
                    {count}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {max === -1 ? '∞' : max}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(org.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
