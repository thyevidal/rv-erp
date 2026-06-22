import { createAdminClient } from '@/lib/supabase/admin'
import { SchemaType, type Tool } from '@google/generative-ai'

// ─── Definição das tools para o Gemini ────────────────────────────────────────

export const OBRA_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'get_resumo_obra',
        description: 'Retorna os dados gerais da obra: nome, endereço, área, prazo e observações.',
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
        description: 'Retorna as tarefas do cronograma com status calculado: pendente, em_andamento, atrasada ou sem_data. Use para análise de andamento e identificação de atrasos.',
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
        description: 'Retorna o orçamento completo com curva ABC já calculada: cada item tem custo total, percentual individual, percentual acumulado e classificação A/B/C. Use para análise de custos e identificação de itens críticos.',
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
        description: 'Retorna o resumo financeiro da obra: custo direto total, BDI, preço de venda, composição por tipo (material vs mão de obra).',
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

const r2 = (n: number) => Math.round(n * 100) / 100

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
          .select('*')
          .eq('id', obra_id)
          .single()
        if (!data) return 'Obra não encontrada.'
        return JSON.stringify({
          nome: data.nome,
          status: data.status,
          endereco: data.endereco ?? null,
          cidade: data.cidade ?? null,
          uf: data.uf ?? null,
          area_m2: data.area_m2 ?? null,
          prazo_dias: data.prazo_dias ?? null,
          data_inicio: data.data_inicio ?? null,
          data_fim: data.data_fim ?? null,
          descricao: data.descricao ?? null,
          observacoes: data.observacoes ?? null,
        })
      }

      case 'get_cronograma': {
        const { data } = await admin
          .from('cronograma')
          .select('tarefa, data_prevista_inicio, data_prevista_fim')
          .eq('obra_id', obra_id)
          .order('data_prevista_inicio', { nullsFirst: false })

        if (!data?.length) return 'Nenhuma tarefa cadastrada no cronograma.'

        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)

        const tarefas = data.map(t => {
          let status: string
          if (!t.data_prevista_inicio || !t.data_prevista_fim) {
            status = 'sem_data'
          } else {
            const inicio = new Date(t.data_prevista_inicio)
            const fim = new Date(t.data_prevista_fim)
            if (hoje > fim) status = 'atrasada'
            else if (hoje >= inicio) status = 'em_andamento'
            else status = 'pendente'
          }
          return {
            tarefa: t.tarefa,
            data_inicio: t.data_prevista_inicio ?? null,
            data_fim: t.data_prevista_fim ?? null,
            status,
          }
        })

        const resumo = {
          total: tarefas.length,
          atrasadas: tarefas.filter(t => t.status === 'atrasada').length,
          em_andamento: tarefas.filter(t => t.status === 'em_andamento').length,
          pendentes: tarefas.filter(t => t.status === 'pendente').length,
          sem_data: tarefas.filter(t => t.status === 'sem_data').length,
        }

        return JSON.stringify({ resumo, tarefas })
      }

      case 'get_orcamento': {
        const { data } = await admin
          .from('orcamento_itens')
          .select('etapa, subetapa, descricao, tipo, unidade, quantidade, custo_unitario_aplicado')
          .eq('obra_id', obra_id)

        if (!data?.length) return 'Nenhum item cadastrado no orçamento.'

        // Calcula custo total por item
        const itens = data.map(i => ({
          etapa: i.etapa,
          subetapa: i.subetapa ?? null,
          descricao: i.descricao,
          tipo: i.tipo,
          unidade: i.unidade,
          quantidade: i.quantidade,
          custo_unitario: r2(i.custo_unitario_aplicado),
          custo_total: r2(i.quantidade * i.custo_unitario_aplicado),
        }))

        // Ordena por custo desc para curva ABC
        const ordenados = [...itens].sort((a, b) => b.custo_total - a.custo_total)
        const total = ordenados.reduce((s, i) => s + i.custo_total, 0)

        let acumulado = 0
        const comABC = ordenados.map(i => {
          const pct = total > 0 ? (i.custo_total / total) * 100 : 0
          acumulado += pct
          const classe = acumulado <= 80 ? 'A' : acumulado <= 95 ? 'B' : 'C'
          return { ...i, pct_individual: r2(pct), pct_acumulada: r2(acumulado), classe_abc: classe }
        })

        // Totais por tipo
        const totalMaterial = itens.filter(i => i.tipo === 'MATERIAL').reduce((s, i) => s + i.custo_total, 0)
        const totalMdo = itens.filter(i => i.tipo === 'MAO_DE_OBRA').reduce((s, i) => s + i.custo_total, 0)

        return JSON.stringify({
          custo_total: r2(total),
          total_materiais: r2(totalMaterial),
          total_mao_de_obra: r2(totalMdo),
          itens_por_abc: comABC,
        })
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
          (s, i) => s + (i.quantidade ?? 0) * (i.custo_unitario_aplicado ?? 0), 0
        )
        const custoMaterial = (itens ?? []).filter(i => i.tipo === 'MATERIAL')
          .reduce((s, i) => s + i.quantidade * i.custo_unitario_aplicado, 0)
        const custoMdo = (itens ?? []).filter(i => i.tipo === 'MAO_DE_OBRA')
          .reduce((s, i) => s + i.quantidade * i.custo_unitario_aplicado, 0)

        const bdiPct = bdi
          ? (bdi.impostos ?? 0) + (bdi.margem_lucro ?? 0) + (bdi.seguros ?? 0) + (bdi.custos_indiretos ?? 0)
          : 0
        const precoVenda = bdiPct > 0 && bdiPct < 100
          ? custoDireto / (1 - bdiPct / 100)
          : custoDireto

        return JSON.stringify({
          custo_direto_total: r2(custoDireto),
          custo_materiais: r2(custoMaterial),
          custo_mao_de_obra: r2(custoMdo),
          bdi_percentual: bdiPct,
          bdi_composicao: bdi ? {
            impostos: bdi.impostos ?? 0,
            margem_lucro: bdi.margem_lucro ?? 0,
            seguros: bdi.seguros ?? 0,
            custos_indiretos: bdi.custos_indiretos ?? 0,
          } : null,
          preco_venda: r2(precoVenda),
          markup_total: r2(precoVenda - custoDireto),
        })
      }

      default:
        return `Tool desconhecida: ${name}`
    }
  } catch {
    return 'Erro ao consultar dados da obra.'
  }
}
