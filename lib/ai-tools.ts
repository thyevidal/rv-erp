import { createAdminClient } from '@/lib/supabase/admin'
import { SchemaType, type Tool } from '@google/generative-ai'
import type { PendingCronogramaItem, PendingOrcamentoItem, PendingChanges } from '@/lib/ai-types'

export type { PendingCronogramaItem, PendingOrcamentoItem, PendingChanges }

export type ToolResult = {
  text: string
  pendingChanges?: PendingChanges
}

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
      {
        name: 'propose_cronograma',
        description: 'Propõe tarefas para o cronograma da obra. Use quando o usuário pedir para criar, gerar, reorganizar ou atualizar o cronograma. As mudanças ficam pendentes até o usuário confirmar no chat — nunca são aplicadas automaticamente. Chame get_resumo_obra antes para obter data_inicio e prazo_dias.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            obra_id: { type: SchemaType.STRING, description: 'ID da obra' },
            action: {
              type: SchemaType.STRING,
              description: '"replace" para substituir todo o cronograma existente, "append" para adicionar tarefas ao cronograma atual',
            },
            tarefas: {
              type: SchemaType.ARRAY,
              description: 'Lista de tarefas propostas',
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  tarefa: { type: SchemaType.STRING, description: 'Nome da tarefa' },
                  data_prevista_inicio: { type: SchemaType.STRING, description: 'Data no formato YYYY-MM-DD, ou null se sem data' },
                  data_prevista_fim: { type: SchemaType.STRING, description: 'Data no formato YYYY-MM-DD, ou null se sem data' },
                },
                required: ['tarefa'],
              },
            },
          },
          required: ['obra_id', 'action', 'tarefas'],
        },
      },
      {
        name: 'propose_orcamento_itens',
        description: 'Propõe itens para adicionar ao orçamento da obra. Use quando o usuário pedir para adicionar itens faltantes ou complementar o orçamento. As mudanças ficam pendentes até o usuário confirmar no chat — nunca são aplicadas automaticamente.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            obra_id: { type: SchemaType.STRING, description: 'ID da obra' },
            itens: {
              type: SchemaType.ARRAY,
              description: 'Lista de itens propostos',
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  etapa: { type: SchemaType.STRING, description: 'Etapa da obra (ex: FUNDAÇÃO, ESTRUTURA)' },
                  subetapa: { type: SchemaType.STRING, description: 'Subetapa opcional' },
                  descricao: { type: SchemaType.STRING, description: 'Descrição do item' },
                  tipo: { type: SchemaType.STRING, description: 'MATERIAL ou MAO_DE_OBRA' },
                  unidade: { type: SchemaType.STRING, description: 'Unidade de medida (m², m³, kg, sc, vb, un...)' },
                  quantidade: { type: SchemaType.NUMBER, description: 'Quantidade' },
                  custo_unitario_aplicado: { type: SchemaType.NUMBER, description: 'Custo unitário em reais' },
                },
                required: ['etapa', 'descricao', 'tipo', 'unidade', 'quantidade', 'custo_unitario_aplicado'],
              },
            },
          },
          required: ['obra_id', 'itens'],
        },
      },
    ],
  },
]

// ─── Executores das tools ─────────────────────────────────────────────────────

const r2 = (n: number) => Math.round(n * 100) / 100

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const admin = createAdminClient()
  const obra_id = args.obra_id as string

  try {
    switch (name) {
      case 'get_resumo_obra': {
        const { data } = await admin
          .from('obras')
          .select('*')
          .eq('id', obra_id)
          .single()
        if (!data) return { text: 'Obra não encontrada.' }
        return {
          text: JSON.stringify({
            nome: data.nome,
            status: data.status,
            endereco: data.endereco ?? null,
            cidade: data.cidade ?? null,
            uf: data.uf ?? null,
            area_m2: data.area_m2 ?? null,
            prazo_dias: data.prazo_dias ?? null,
            data_inicio: data.data_inicio ?? null,
            data_fim: data.data_fim ?? null,
            // Campos livres delimitados para evitar prompt injection
            descricao: data.descricao ? `<user_data>${data.descricao}</user_data>` : null,
            observacoes: data.observacoes ? `<user_data>${data.observacoes}</user_data>` : null,
          }),
        }
      }

      case 'get_cronograma': {
        const { data } = await admin
          .from('cronograma')
          .select('tarefa, data_prevista_inicio, data_prevista_fim')
          .eq('obra_id', obra_id)
          .order('data_prevista_inicio', { nullsFirst: false })

        if (!data?.length) return { text: 'Nenhuma tarefa cadastrada no cronograma.' }

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

        return { text: JSON.stringify({ resumo, tarefas }) }
      }

      case 'get_orcamento': {
        const { data } = await admin
          .from('orcamento_itens')
          .select('etapa, subetapa, descricao, tipo, unidade, quantidade, custo_unitario_aplicado')
          .eq('obra_id', obra_id)

        if (!data?.length) return { text: 'Nenhum item cadastrado no orçamento.' }

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

        const ordenados = [...itens].sort((a, b) => b.custo_total - a.custo_total)
        const total = ordenados.reduce((s, i) => s + i.custo_total, 0)

        let acumulado = 0
        const comABC = ordenados.map(i => {
          const pct = total > 0 ? (i.custo_total / total) * 100 : 0
          acumulado += pct
          const classe = acumulado <= 80 ? 'A' : acumulado <= 95 ? 'B' : 'C'
          return { ...i, pct_individual: r2(pct), pct_acumulada: r2(acumulado), classe_abc: classe }
        })

        const totalMaterial = itens.filter(i => i.tipo === 'MATERIAL').reduce((s, i) => s + i.custo_total, 0)
        const totalMdo = itens.filter(i => i.tipo === 'MAO_DE_OBRA').reduce((s, i) => s + i.custo_total, 0)

        return {
          text: JSON.stringify({
            custo_total: r2(total),
            total_materiais: r2(totalMaterial),
            total_mao_de_obra: r2(totalMdo),
            itens_por_abc: comABC,
          }),
        }
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

        return {
          text: JSON.stringify({
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
          }),
        }
      }

      case 'propose_cronograma': {
        const tarefas = (args.tarefas ?? []) as PendingCronogramaItem[]
        const action = (args.action as string) === 'replace' ? 'replace' : 'append'
        if (!tarefas.length) return { text: 'Nenhuma tarefa na proposta.' }
        return {
          text: `Proposta gerada: ${tarefas.length} tarefa(s) (ação: ${action}). Aguardando confirmação do usuário.`,
          pendingChanges: { type: 'cronograma', action, items: tarefas },
        }
      }

      case 'propose_orcamento_itens': {
        const itens = (args.itens ?? []) as PendingOrcamentoItem[]
        if (!itens.length) return { text: 'Nenhum item na proposta.' }
        return {
          text: `Proposta gerada: ${itens.length} item(ns) para o orçamento. Aguardando confirmação do usuário.`,
          pendingChanges: { type: 'orcamento', action: 'append', items: itens },
        }
      }

      default:
        return { text: `Tool desconhecida: ${name}` }
    }
  } catch {
    return { text: 'Erro ao consultar dados da obra.' }
  }
}
