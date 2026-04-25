import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Shield, ShieldAlert, Check, X, Mail } from 'lucide-react'
import AddMemberDialog from '@/components/membros/AddMemberDialog'

function getInitials(name?: string | null) {
  if (!name) return 'U'
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default async function MembrosPage() {
  const supabase = await createClient()

  // Buscar usuário logado para validar se é admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, organization_id, organizations(name)')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6 text-center text-destructive flex flex-col items-center">
          <ShieldAlert className="w-12 h-12 mb-4 opacity-80" />
          <h2 className="text-xl font-bold">Acesso Negado</h2>
          <p className="mt-2 text-sm">Apenas administradores podem gerenciar a equipe.</p>
        </CardContent>
      </Card>
    )
  }

  // Buscar todos os membros da mesma organização
  const { data: membros } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', currentProfile.organization_id)
    .order('role', { ascending: true }) // admins primeiro
    .order('created_at', { ascending: true })

  const membersList = membros ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Membros da Equipe
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gerencie o acesso de sócios e funcionários na organização 
            <strong className="text-foreground ml-1">{(currentProfile.organizations as any)?.name}</strong>
          </p>
        </div>
        <AddMemberDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {membersList.map((m) => (
          <Card key={m.id} className={`border-border/60 ${m.id === user.id ? 'ring-1 ring-primary/20' : ''}`}>
            <CardHeader className="pb-3 border-b border-border/30">
              <div className="flex items-start gap-4">
                <Avatar className="h-11 w-11 border bg-muted">
                  <AvatarFallback className="font-medium text-muted-foreground">
                    {getInitials(m.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold truncate flex items-center gap-2">
                    {m.name || 'Usuário'}
                    {m.id === user.id && <Badge variant="outline" className="text-[10px] h-5 ml-1">Você</Badge>}
                  </CardTitle>
                  
                  {m.email && (
                    <div className="flex items-center text-xs text-muted-foreground mt-0.5 truncate">
                      <Mail className="w-3 h-3 mr-1 shrink-0" />
                      <span className="truncate">{m.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-2">
                    {m.role === 'admin' ? (
                      <Badge variant="default" className="text-[10px] h-5 bg-primary/20 text-primary hover:bg-primary/30">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        Membro
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Financeiro</span>
                {m.can_view_finance ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500/50" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Excluir Registros</span>
                {m.can_delete_records ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500/50" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gerenciar Estoque</span>
                {m.can_edit_inventory ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500/50" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
