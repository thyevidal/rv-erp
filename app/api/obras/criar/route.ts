import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const CHECKLIST_AC: { fase: number; item: string; ordem: number }[] = [
  // Fase 1
  { fase: 1, item: 'Encaminhar documentação do cliente ao correspondente', ordem: 1 },
  { fase: 1, item: 'Obter simulação e aprovação de crédito', ordem: 2 },
  { fase: 1, item: 'Definir budget total (terreno + construção + taxas)', ordem: 3 },
  // Fase 2
  { fase: 2, item: 'Obter Certidão de Ônus Reais do terreno', ordem: 1 },
  { fase: 2, item: 'Obter Certidão Negativa de Débitos Municipais', ordem: 2 },
  { fase: 2, item: 'Confirmar desmembramento e matrícula do lote', ordem: 3 },
  { fase: 2, item: 'Desenvolver projeto arquitetônico dentro do budget', ordem: 4 },
  { fase: 2, item: 'Contratar projetos complementares (estrutural, elétrico, hidro)', ordem: 5 },
  { fase: 2, item: 'Obter ARTs dos engenheiros responsáveis', ordem: 6 },
  // Fase 3
  { fase: 3, item: 'Submeter projeto arquitetônico na prefeitura', ordem: 1 },
  { fase: 3, item: 'Obter Alvará de Construção', ordem: 2 },
  { fase: 3, item: 'Preencher PCI — Orçamento resumo por etapas', ordem: 3 },
  { fase: 3, item: 'Preencher PCI — Cronograma físico-financeiro', ordem: 4 },
  { fase: 3, item: 'Enviar PCI completa ao correspondente', ordem: 5 },
  { fase: 3, item: 'Aguardar validação da PCI pela Caixa', ordem: 6 },
  // Fase 4
  { fase: 4, item: 'Cliente pagar taxa de engenharia do banco', ordem: 1 },
  { fase: 4, item: 'Vistoria inicial do engenheiro credenciado (terreno vazio)', ordem: 2 },
  { fase: 4, item: 'Assinatura do contrato na agência (cliente + construtor + vendedor)', ordem: 3 },
  { fase: 4, item: 'Registro do contrato em cartório (CRI)', ordem: 4 },
  { fase: 4, item: 'Confirmação do pagamento do terreno ao vendedor', ordem: 5 },
  // Fase 5
  { fase: 5, item: 'Iniciar obra com recursos próprios / adiantamento', ordem: 1 },
  { fase: 5, item: 'Solicitar 1ª medição ao banco', ordem: 2 },
  { fase: 5, item: 'Acompanhar vistoria do fiscal do banco', ordem: 3 },
  { fase: 5, item: 'Confirmar liberação da 1ª parcela', ordem: 4 },
  { fase: 5, item: 'Repetir ciclo de medições mensais até conclusão', ordem: 5 },
  // Fase 6
  { fase: 6, item: 'Acionar prefeitura para vistoria e emissão do Habite-se', ordem: 1 },
  { fase: 6, item: 'Regularizar INSS da obra (CNO/SERO) e obter CND', ordem: 2 },
  { fase: 6, item: 'Averbar a construção no Cartório de Registro de Imóveis', ordem: 3 },
  { fase: 6, item: 'Entregar matrícula atualizada ao banco', ordem: 4 },
  { fase: 6, item: 'Confirmar liberação da última parcela retida', ordem: 5 },
]

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

      await admin.from('ac_checklist').insert(
        CHECKLIST_AC.map((c) => ({ obra_id: obra.id, fase_numero: c.fase, item: c.item, ordem: c.ordem, concluido: false }))
      )

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
