import { createAdminClient } from '@/lib/supabase/admin'
import { Building2, Users, HardHat, TrendingUp } from 'lucide-react'

export default async function AdminOverviewPage() {
  const admin = createAdminClient()

  const [
    { count: totalOrgs },
    { count: totalUsers },
    { data: subs },
    { count: totalObras },
  ] = await Promise.all([
    admin.from('organizations').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('subscriptions').select('*, plans(preco_mensal, max_obras)'),
    admin.from('obras').select('*', { count: 'exact', head: true }).is('deleted_at', null),
  ])

  const orgsGratuito = (subs ?? []).filter((s) => {
    const plan = (s as any)?.plans
    return !plan || plan.preco_mensal === 0
  }).length

  const orgsPro = (subs ?? []).filter((s) => {
    const plan = (s as any)?.plans
    return plan && (plan.preco_mensal > 0 || plan.max_obras === -1)
  }).length

  const metrics = [
    { label: 'Total de Organizações', value: totalOrgs ?? 0, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total de Usuários', value: totalUsers ?? 0, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Orgs Gratuito / Pro', value: `${orgsGratuito} / ${orgsPro}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total de Obras', value: totalObras ?? 0, icon: HardHat, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Visão Geral</h1>
        <p className="text-muted-foreground text-sm mt-1">Métricas gerais da plataforma Grev.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border/60 rounded-xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
