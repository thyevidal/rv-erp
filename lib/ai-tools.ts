import { createAdminClient } from '@/lib/supabase/admin'
import { SchemaType, type Tool } from '@google/generative-ai'

// ─── Definição das tools para o Gemini ────────────────────────────────────────

export const OBRA_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'get_resumo_obra',
        description: 'Retorna os dados gerais da obra: nome, cliente, endereço, área, prazo e observações.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            obra_id: { type: SchemaType.STRING, description: 'ID da obra' },
          },
          required: ['obra_id'],
        },
      },
      {
        name: 'get_cronograma',
        description: 'Retorna todas as tarefas do cronograma da obra com datas previstas de início e fim.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            obra_id: { type: SchemaType.STRING, description: 'ID da obra' },
          },
          required: ['obra_id'],
        },
      },
      {
        name: 'get_orcamento',
        description: 'Retorna todos os itens do orçamento da obra com etapa, tipo (material ou mão de obra), quantidade, custo unitário e descrição.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            obra_id: { type: SchemaType.STRING, description: 'ID da obra' },
          },
          required: ['obra_id'],
        },
      },
      {
        name: 'get_status_financeiro',
        description: 'Retorna o resumo financeiro da obra: custo direto total, BDI configurado e preço de venda total.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            obra_id: { type: SchemaType.STRING, description: 'ID da obra' },
          },
          required: ['obra_id'],
        },
      },
    ],
  },
]

// ─── Executores das tools ─────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  args: Record<string, string>
): Promise<string> {
  const admin = createAdminClient()
  const { obra_id } = args

  try {
    switch (name) {
      case 'get_resumo_obra': {
        const { data } = await admin
          .from('obras')
          .select('nome, cliente, endereco, cidade, uf, area_m2, prazo_dias, observacoes')
          .eq('id', obra_id)
          .single()
        if (!data) return 'Obra não encontrada.'
        return JSON.stringify(data)
      }

      case 'get_cronograma': {
        const { data } = await admin
          .from('cronograma')
          .select('tarefa, data_prevista_inicio, data_prevista_fim')
          .eq('obra_id', obra_id)
          .order('data_prevista_inicio')
        if (!data?.length) return 'Nenhuma tarefa cadastrada no cronograma.'
        return JSON.stringify(data)
      }

      case 'get_orcamento': {
        const { data } = await admin
          .from('orcamento_itens')
          .select('etapa, subetapa, descricao, tipo, unidade, quantidade, custo_unitario_aplicado')
          .eq('obra_id', obra_id)
          .order('etapa')
          .order('created_at')
        if (!data?.length) return 'Nenhum item cadastrado no orçamento.'
        return JSON.stringify(data)
      }

      case 'get_status_financeiro': {
        const [{ data: itens }, { data: bdi }] = await Promise.all([
          admin
            .from('orcamento_itens')
            .select('tipo, quantidade, custo_unitario_aplicado')
            .eq('obra_id', obra_id),
          admin
            .from('bdi_config')
            .select('impostos, margem_lucro, seguros, custos_indiretos')
            .eq('obra_id', obra_id)
            .maybeSingle(),
        ])

        const custoDireto = (itens ?? []).reduce(
          (s, i) => s + (i.quantidade ?? 0) * (i.custo_unitario_aplicado ?? 0),
          0
        )
        const bdiPct = bdi
          ? (bdi.impostos ?? 0) + (bdi.margem_lucro ?? 0) + (bdi.seguros ?? 0) + (bdi.custos_indiretos ?? 0)
          : 0
        const precoVenda =
          bdiPct > 0 && bdiPct < 100
            ? custoDireto / (1 - bdiPct / 100)
            : custoDireto

        return JSON.stringify({
          custo_direto: Number(custoDireto.toFixed(2)),
          bdi_percentual: bdiPct,
          preco_venda: Number(precoVenda.toFixed(2)),
          margem_lucro: bdi?.margem_lucro ?? 0,
          impostos: bdi?.impostos ?? 0,
        })
      }

      default:
        return `Tool desconhecida: ${name}`
    }
  } catch {
    return `Erro ao consultar dados da obra.`
  }
}
