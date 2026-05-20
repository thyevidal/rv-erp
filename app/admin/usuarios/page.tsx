import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminUsuariosPage() {
  const admin = createAdminClient()

  const [{ data: profiles }, { data: orgs }] = await Promise.all([
    admin.from('profiles').select('*').order('created_at', { ascending: false }),
    admin.from('organizations').select('id, name'),
  ])

  const orgMap = new Map((orgs ?? []).map((o) => [o.id, o.name]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-muted-foreground text-sm mt-1">{profiles?.length ?? 0} usuários no sistema.</p>
      </div>

      <div className="border border-border/60 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left text-muted-foreground text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Organização</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
              <th className="px-4 py-3 font-medium">LGPD</th>
              <th className="px-4 py-3 font-medium">Superuser</th>
              <th className="px-4 py-3 font-medium">Desde</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p) => (
              <tr key={p.id} className="border-t border-border/60 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{p.name ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.email ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{orgMap.get(p.organization_id) ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    p.role === 'admin'
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}>
                    {p.role === 'admin' ? 'Admin' : 'Membro'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {p.lgpd_aceito ? (
                    <span className="text-green-600">✓ {p.lgpd_aceito_em ? new Date(p.lgpd_aceito_em).toLocaleDateString('pt-BR') : 'Aceito'}</span>
                  ) : (
                    <span className="text-muted-foreground">Não</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.is_superuser ? <span className="text-yellow-600 text-xs font-semibold">✓ Super</span> : <span className="text-muted-foreground text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(p.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
