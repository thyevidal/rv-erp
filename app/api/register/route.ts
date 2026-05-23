import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, nome, orgName } = await request.json()

    if (!userId || !nome || !orgName) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Criar organização (bypassa RLS com service role)
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({ name: orgName })
      .select('id')
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Erro ao criar organização: ' + orgError?.message }, { status: 500 })
    }

    // 2. Upsert perfil do usuário — cria ou atualiza (garante que a linha exista)
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({ id: userId, name: nome, organization_id: org.id }, { onConflict: 'id' })

    if (profileError) {
      return NextResponse.json({ error: 'Erro ao atualizar perfil: ' + profileError.message }, { status: 500 })
    }

    // 3. Buscar plano gratuito e criar subscription
    const { data: freePlan } = await admin
      .from('plans')
      .select('id')
      .eq('preco_mensal', 0)
      .eq('ativo', true)
      .single()

    if (freePlan) {
      await admin.from('subscriptions').insert({
        organization_id: org.id,
        plan_id: freePlan.id,
        status: 'ATIVA',
      })
    }

    return NextResponse.json({ ok: true, orgId: org.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
