'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, templateBoasVindas } from '@/lib/email'

export async function createMemberAction(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'admin' | 'member'
  const canViewFinance = formData.get('canViewFinance') === 'true'
  const canDeleteRecords = formData.get('canDeleteRecords') === 'true'
  const canEditInventory = formData.get('canEditInventory') === 'true'
  const lgpdAceito = formData.get('lgpd_aceito') === 'true'

  if (!name || !email || !password || !role) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  // Verificar se quem está chamando é admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Apenas administradores podem convidar novos membros.' }
  }

  // Utilizar o admin client para criar a conta sem deslogar a sessão atual
  const adminClient = createAdminClient()
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { error: 'Erro ao criar conta no Supabase: ' + (authError?.message || 'Desconhecido') }
  }

  // Inserir perfil
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: authData.user.id,
    organization_id: profile.organization_id,
    name,
    email,
    role,
    can_view_finance: canViewFinance,
    can_delete_records: canDeleteRecords,
    can_edit_inventory: canEditInventory,
    lgpd_aceito: lgpdAceito,
    lgpd_aceito_em: lgpdAceito ? new Date().toISOString() : null,
  })

  if (profileError) {
    // Se falhar o perfil, tentar deletar a conta recém criada para não deixar dados órfãos
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return { error: 'Erro ao criar perfil de permissões: ' + profileError.message }
  }

  // Enviar e-mail de boas-vindas (falha silenciosa — não bloqueia o retorno)
  try {
    await sendEmail(email, 'Bem-vindo ao Prumo ERP', templateBoasVindas(name))
  } catch {
    console.error('[createMember] Falha ao enviar e-mail de boas-vindas.')
  }

  return { success: true }
}
