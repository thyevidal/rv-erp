import { createClient } from '@/lib/supabase/server'
import AgendaClient from './AgendaClient'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const orgId = profile?.organization_id

  const [{ data: eventos }, { data: cronogramas }, { data: obras }, { data: membros }] =
    await Promise.all([
      supabase
        .from('agenda_eventos')
        .select('*')
        .eq('organization_id', orgId)
        .order('data_inicio'),
      supabase
        .from('cronograma')
        .select('id, obra_id, tarefa, data_prevista_inicio, data_prevista_fim, responsavel, status')
        .in('obra_id',
          (await supabase.from('obras').select('id').eq('organization_id', orgId).is('deleted_at', null)).data?.map(o => o.id) ?? []
        ),
      supabase
        .from('obras')
        .select('id, nome')
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .order('nome'),
      supabase
        .from('profiles')
        .select('id, name')
        .eq('organization_id', orgId),
    ])

  return (
    <AgendaClient
      eventos={eventos ?? []}
      cronogramas={cronogramas ?? []}
      obras={obras ?? []}
      membros={membros ?? []}
      userId={user.id}
      orgId={orgId}
      isAdmin={profile?.role === 'admin'}
    />
  )
}
