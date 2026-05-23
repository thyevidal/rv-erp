import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Valida sessão do usuário
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await request.json()
    const { obra: obraData, tipo } = body

    // Valida organização do usuário
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 403 })

    const orgId = profile.organization_id

    // Verifica limite do plano
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_id, plans(max_obras)')
      .eq('organization_id', orgId)
      .eq('status', 'ATIVA')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const maxObras: number = (sub as any)?.plans?.max_obras ?? 1

    if (maxObras !== -1) {
      const { count } = await supabase
        .from('obras')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null)

      if ((count ?? 0) >= maxObras) {
        return NextResponse.json({
          error: `Você atingiu o limite de ${maxObras} obra${maxObras > 1 ? 's' : ''} do seu plano. Faça upgrade para continuar.`,
          limitExceeded: true,
        }, { status: 403 })
      }
    }

    // Usa admin client para bypassar RLS no insert
    const admin = createAdminClient()

    const { data: obra, error: obraError } = await admin.from('obras').insert({
      ...obraData,
      user_id: user.id,
      organization_id: orgId,
      tipo,
    }).select().single()

    if (obraError || !obra) {
      return NextResponse.json({ error: obraError?.message ?? 'Erro ao criar obra.' }, { status: 500 })
    }

    // Se AC, criar fases e checklist
    if (tipo === 'AQUISICAO_CONSTRUCAO') {
      await admin.from('ac_fases').insert(
        [1, 2, 3, 4, 5, 6].map(n => ({ obra_id: obra.id, fase_numero: n, status: n === 1 ? 'EM_ANDAMENTO' : 'PENDENTE' }))
      )

      const { data: checklistTemplate } = await supabase
        .from('ac_checklist_template')
        .select('fase, item, ordem')
        .order('fase').order('ordem')

      if (checklistTemplate && checklistTemplate.length > 0) {
        await admin.from('ac_checklist').insert(
          checklistTemplate.map((c: any) => ({ obra_id: obra.id, fase_numero: c.fase, item: c.item, ordem: c.ordem, concluido: false }))
        )
      }

      // Acessos para cliente e correspondente
      const acessos: any[] = []
      if (obraData.cliente_nome) acessos.push({ obra_id: obra.id, tipo: 'CLIENTE', nome: obraData.cliente_nome, email: null })
      if (obraData.correspondente_nome) acessos.push({ obra_id: obra.id, tipo: 'CORRESPONDENTE', nome: obraData.correspondente_nome, email: obraData.correspondente_email || null })

      let acessosCriados: any[] = []
      if (acessos.length > 0) {
        const { data } = await admin.from('ac_acessos').insert(acessos).select()
        acessosCriados = data ?? []
      }

      return NextResponse.json({ ok: true, obra, acessosCriados })
    }

    return NextResponse.json({ ok: true, obra })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
