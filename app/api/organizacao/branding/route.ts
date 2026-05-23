import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 403 })
    }

    const { data: org } = await admin
      .from('organizations')
      .select('nome_razao_social, cnpj, telefone, logo_url, cor_primaria')
      .eq('id', profile.organization_id)
      .single()

    return NextResponse.json({ ok: true, orgId: profile.organization_id, branding: org ?? {} })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const admin = createAdminClient()

    // Busca organization_id do usuário via admin (sem RLS)
    const { data: profile } = await admin
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 403 })
    }

    const body = await request.json()
    const { nome_razao_social, cnpj, telefone, logo_url, cor_primaria } = body

    const { error } = await admin
      .from('organizations')
      .update({
        nome_razao_social: nome_razao_social || null,
        cnpj: cnpj || null,
        telefone: telefone || null,
        logo_url: logo_url || null,
        cor_primaria: cor_primaria || '#3C3489',
      })
      .eq('id', profile.organization_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
