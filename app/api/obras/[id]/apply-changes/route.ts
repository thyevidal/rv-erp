import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PendingChanges } from '@/lib/ai-types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { id: obraId } = await params

  const { data: obra } = await supabase.from('obras').select('id').eq('id', obraId).single()
  if (!obra) return NextResponse.json({ error: 'Obra não encontrada.' }, { status: 404 })

  const body = await request.json()
  const { pendingChanges }: { pendingChanges: PendingChanges } = body
  if (!pendingChanges) return NextResponse.json({ error: 'Nenhuma mudança para aplicar.' }, { status: 400 })

  const admin = createAdminClient()

  try {
    switch (pendingChanges.type) {
      case 'cronograma': {
        if (pendingChanges.action === 'replace') {
          const { error } = await admin.from('cronograma').delete().eq('obra_id', obraId)
          if (error) throw error
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

      case 'update_cronograma': {
        await Promise.all(
          pendingChanges.items.map(t => {
            const updates: Record<string, unknown> = {}
            if (t.tarefa !== undefined) updates.tarefa = t.tarefa
            if (t.data_prevista_inicio !== undefined) updates.data_prevista_inicio = t.data_prevista_inicio
            if (t.data_prevista_fim !== undefined) updates.data_prevista_fim = t.data_prevista_fim
            return admin.from('cronograma').update(updates).eq('id', t.id).eq('obra_id', obraId)
          })
        )
        return NextResponse.json({ ok: true, applied: pendingChanges.items.length })
      }

      case 'orcamento': {
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

      case 'delete_orcamento': {
        const ids = pendingChanges.items.map(i => i.id)
        const { error } = await admin.from('orcamento_itens').delete().in('id', ids).eq('obra_id', obraId)
        if (error) throw error
        return NextResponse.json({ ok: true, applied: ids.length })
      }

      case 'update_orcamento': {
        await Promise.all(
          pendingChanges.items.map(i => {
            const updates: Record<string, unknown> = {}
            if (i.descricao !== undefined) updates.descricao = i.descricao
            if (i.etapa !== undefined) updates.etapa = i.etapa
            if (i.subetapa !== undefined) updates.subetapa = i.subetapa
            if (i.quantidade !== undefined) updates.quantidade = i.quantidade
            if (i.custo_unitario_aplicado !== undefined) updates.custo_unitario_aplicado = i.custo_unitario_aplicado
            if (i.unidade !== undefined) updates.unidade = i.unidade
            return admin.from('orcamento_itens').update(updates).eq('id', i.id).eq('obra_id', obraId)
          })
        )
        return NextResponse.json({ ok: true, applied: pendingChanges.items.length })
      }

      default:
        return NextResponse.json({ error: 'Tipo desconhecido.' }, { status: 400 })
    }
  } catch (err) {
    console.error('[apply-changes]', err)
    return NextResponse.json({ error: 'Erro ao aplicar mudanças.' }, { status: 500 })
  }
}
