import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PendingChanges } from '@/lib/ai-tools'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { id: obraId } = await params

  // Valida acesso à obra via RLS
  const { data: obra } = await supabase
    .from('obras')
    .select('id')
    .eq('id', obraId)
    .single()

  if (!obra) {
    return NextResponse.json({ error: 'Obra não encontrada.' }, { status: 404 })
  }

  const body = await request.json()
  const { pendingChanges }: { pendingChanges: PendingChanges } = body

  if (!pendingChanges) {
    return NextResponse.json({ error: 'Nenhuma mudança para aplicar.' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    if (pendingChanges.type === 'cronograma') {
      if (pendingChanges.action === 'replace') {
        const { error: delError } = await admin
          .from('cronograma')
          .delete()
          .eq('obra_id', obraId)

        if (delError) throw delError
      }

      const rows = pendingChanges.items.map(t => ({
        obra_id: obraId,
        tarefa: t.tarefa,
        data_prevista_inicio: t.data_prevista_inicio ?? null,
        data_prevista_fim: t.data_prevista_fim ?? null,
      }))

      const { error } = await admin.from('cronograma').insert(rows)
      if (error) throw error

      return NextResponse.json({ ok: true, applied: rows.length })
    }

    if (pendingChanges.type === 'orcamento') {
      const rows = pendingChanges.items.map(i => ({
        obra_id: obraId,
        etapa: i.etapa,
        subetapa: i.subetapa ?? null,
        descricao: i.descricao,
        tipo: i.tipo,
        unidade: i.unidade,
        quantidade: i.quantidade,
        custo_unitario_aplicado: i.custo_unitario_aplicado,
      }))

      const { error } = await admin.from('orcamento_itens').insert(rows)
      if (error) throw error

      return NextResponse.json({ ok: true, applied: rows.length })
    }

    return NextResponse.json({ error: 'Tipo de mudança desconhecido.' }, { status: 400 })
  } catch (err) {
    console.error('[apply-changes]', err)
    return NextResponse.json({ error: 'Erro ao aplicar mudanças.' }, { status: 500 })
  }
}
