'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Plus, Loader2, AlertTriangle, ArrowDownToLine,
  ArrowUpFromLine, RotateCcw, X, History, Box, MapPin,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Item = {
  id: string
  nome: string
  descricao: string | null
  unidade: string
  categoria: string | null
  consumivel: boolean
  quantidade_total: number
  quantidade_disponivel: number
  valor_unitario: number | null
  localizacao: string | null
}

type Movimentacao = {
  id: string
  item_id: string
  obra_id: string | null
  tipo: 'ENTRADA' | 'SAIDA' | 'ALOCACAO' | 'DEVOLUCAO' | 'BAIXA'
  quantidade: number
  data: string
  responsavel: string | null
  observacao: string | null
  obras?: { nome: string } | null
}

type Obra = { id: string; nome: string }

interface Props {
  itens: Item[]
  movimentacoes: Movimentacao[]
  obras: Obra[]
  orgId: string
}

const TIPO_MOV = {
  ENTRADA:   { label: 'Entrada',   icon: ArrowDownToLine, color: 'text-green-500',  bg: 'bg-green-500/10'  },
  SAIDA:     { label: 'Saída',     icon: ArrowUpFromLine, color: 'text-red-500',    bg: 'bg-red-500/10'    },
  ALOCACAO:  { label: 'Alocação',  icon: ArrowUpFromLine, color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
  DEVOLUCAO: { label: 'Devolução', icon: RotateCcw,       color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  BAIXA:     { label: 'Baixa',     icon: X,               color: 'text-red-400',    bg: 'bg-red-400/10'    },
}

type ModalType = 'novo-item' | 'entrada' | 'alocar' | 'devolver' | 'baixa' | 'historico' | null

/** Retorna tempo relativo em pt-BR */
function tempoAtras(dataStr: string): string {
  const d = new Date(dataStr + 'T12:00:00')
  const diffMs = Date.now() - d.getTime()
  const dias = Math.floor(diffMs / 86_400_000)
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'há 1 dia'
  if (dias < 7) return `há ${dias} dias`
  const sem = Math.floor(dias / 7)
  if (sem === 1) return 'há 1 semana'
  if (sem < 4) return `há ${sem} semanas`
  const mes = Math.floor(dias / 30)
  if (mes === 1) return 'há 1 mês'
  if (mes < 12) return `há ${mes} meses`
  const anos = Math.floor(dias / 365)
  return `há ${anos} ano${anos > 1 ? 's' : ''}`
}

type AlocacaoAtiva = {
  key: string
  obra_id: string | null
  obra_nome: string | null
  quantidade: number
  data: string          // data da alocação mais recente para essa obra
  responsavel: string | null
}

/** Calcula quantidades atualmente alocadas por obra para um item */
function calcAlocacoesAtivas(
  itemId: string,
  movimentacoes: Movimentacao[],
): AlocacaoAtiva[] {
  const itemMovs = movimentacoes.filter((m) => m.item_id === itemId)
  // Mapa keyed por obra_id (null → '__sem_obra__')
  const map = new Map<string, AlocacaoAtiva>()

  for (const m of itemMovs) {
    if (m.tipo !== 'ALOCACAO' && m.tipo !== 'DEVOLUCAO') continue
    const key = m.obra_id ?? '__sem_obra__'
    const current = map.get(key) ?? {
      key,
      obra_id: m.obra_id,
      obra_nome: m.obras?.nome ?? null,
      quantidade: 0,
      data: m.data,
      responsavel: m.responsavel,
    }
    if (m.tipo === 'ALOCACAO') {
      current.quantidade += m.quantidade
      // Mantém a data mais recente de alocação
      if (m.data > current.data) {
        current.data = m.data
        current.responsavel = m.responsavel
      }
    } else {
      current.quantidade -= m.quantidade
    }
    map.set(key, current)
  }

  return Array.from(map.values()).filter((a) => a.quantidade > 0.001)
}

export default function EstoqueClient({ itens, movimentacoes, obras, orgId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [modal, setModal] = useState<ModalType>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterCategoria, setFilterCategoria] = useState('all')
  const [search, setSearch] = useState('')

  const [formItem, setFormItem] = useState({
    nome: '', descricao: '', unidade: 'un', categoria: '', consumivel: false,
    valor_unitario: '', localizacao: '',
  })
  const [formMov, setFormMov] = useState({
    quantidade: '', obra_id: '_none_', responsavel: '', observacao: '',
  })

  const categorias = useMemo(() => {
    const set = new Set(itens.map((i) => i.categoria).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [itens])

  const filteredItens = useMemo(() => {
    return itens.filter((i) => {
      if (filterCategoria !== 'all' && i.categoria !== filterCategoria) return false
      if (search && !i.nome.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [itens, filterCategoria, search])

  // Pré-computa alocações ativas por item
  const alocacoesMap = useMemo(() => {
    const m = new Map<string, AlocacaoAtiva[]>()
    for (const item of itens) {
      if (!item.consumivel) {
        m.set(item.id, calcAlocacoesAtivas(item.id, movimentacoes))
      }
    }
    return m
  }, [itens, movimentacoes])

  function openModal(type: ModalType, item?: Item) {
    setSelectedItem(item ?? null)
    setFormMov({ quantidade: '', obra_id: '_none_', responsavel: '', observacao: '' })
    setModal(type)
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault()
    if (!formItem.nome) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    const { error } = await supabase.from('estoque_itens').insert({
      organization_id: orgId,
      nome: formItem.nome,
      descricao: formItem.descricao || null,
      unidade: formItem.unidade,
      categoria: formItem.categoria || null,
      consumivel: formItem.consumivel,
      valor_unitario: formItem.valor_unitario ? parseFloat(formItem.valor_unitario) : null,
      localizacao: formItem.localizacao || null,
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Item criado!')
    setModal(null)
    setFormItem({ nome: '', descricao: '', unidade: 'un', categoria: '', consumivel: false, valor_unitario: '', localizacao: '' })
    router.refresh()
  }

  async function handleMovimentacao(tipo: Movimentacao['tipo']) {
    if (!selectedItem) return
    const qtd = parseFloat(formMov.quantidade.replace(',', '.'))
    if (!qtd || qtd <= 0) { toast.error('Quantidade inválida'); return }

    if (['SAIDA', 'ALOCACAO', 'BAIXA'].includes(tipo) && qtd > selectedItem.quantidade_disponivel) {
      toast.error(`Quantidade indisponível. Disponível: ${selectedItem.quantidade_disponivel} ${selectedItem.unidade}`)
      return
    }
    if (!orgId) { toast.error('Organização não encontrada. Recarregue a página.'); return }
    setSaving(true)

    let delta_total = 0
    let delta_disponivel = 0
    if (tipo === 'ENTRADA')                         { delta_total = qtd;  delta_disponivel = qtd  }
    else if (tipo === 'SAIDA' || tipo === 'BAIXA')  { delta_total = -qtd; delta_disponivel = -qtd }
    else if (tipo === 'ALOCACAO')                   { delta_disponivel = -qtd }
    else if (tipo === 'DEVOLUCAO')                  { delta_disponivel = qtd  }

    const { error: movErr } = await supabase.from('estoque_movimentacoes').insert({
      organization_id: orgId,
      item_id: selectedItem.id,
      obra_id: formMov.obra_id === '_none_' ? null : formMov.obra_id,
      tipo,
      quantidade: qtd,
      data: new Date().toISOString().split('T')[0],
      responsavel: formMov.responsavel || null,
      observacao: formMov.observacao || null,
    })
    if (movErr) { setSaving(false); toast.error(`Erro ao registrar: ${movErr.message}`); return }

    const { error: itemErr } = await supabase.from('estoque_itens').update({
      quantidade_total: selectedItem.quantidade_total + delta_total,
      quantidade_disponivel: selectedItem.quantidade_disponivel + delta_disponivel,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedItem.id)

    setSaving(false)
    if (itemErr) { toast.error(`Movimentação salva, mas erro ao atualizar item: ${itemErr.message}`); return }
    toast.success('Movimentação registrada!')
    setModal(null)
    router.refresh()
  }

  const itemHistorico = useMemo(
    () => selectedItem ? movimentacoes.filter((m) => m.item_id === selectedItem.id) : [],
    [selectedItem, movimentacoes],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Estoque</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {itens.length} ite{itens.length !== 1 ? 'ns' : 'm'} cadastrado{itens.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <Button className="gap-2" onClick={() => openModal('novo-item')}>
          <Plus className="w-4 h-4" />Novo item
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-52 text-sm"
        />
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="h-8 w-44 text-sm"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de itens */}
      {filteredItens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Box className="w-10 h-10 opacity-30" />
          <p className="text-sm">Nenhum item no estoque ainda.</p>
        </div>
      ) : (
        <div className="border border-border/60 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-muted-foreground text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium text-right">Disponível</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItens.map((item) => {
                const semEstoque = item.quantidade_disponivel <= 0
                const alocacoes = alocacoesMap.get(item.id) ?? []
                const qtdAlocada = item.quantidade_total - item.quantidade_disponivel

                return (
                  <tr key={item.id} className="border-t border-border/60 hover:bg-muted/20 align-top">
                    {/* Nome + alocações ativas */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        {semEstoque && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />}
                        <div className="space-y-1.5">
                          <p className="font-medium leading-tight">{item.nome}</p>
                          {item.localizacao && (
                            <p className="text-xs text-muted-foreground">{item.localizacao}</p>
                          )}
                          {/* Alocações ativas — apenas itens não consumíveis */}
                          {!item.consumivel && alocacoes.length > 0 && (
                            <div className="flex flex-col gap-1 mt-1">
                              {alocacoes.map((a) => (
                                <div
                                  key={a.key}
                                  className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-md px-2 py-1 w-fit"
                                >
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="font-medium">
                                    {a.quantidade} {item.unidade}
                                  </span>
                                  <span className="text-blue-500/70">em</span>
                                  <span>{a.obra_nome ?? 'sem obra vinculada'}</span>
                                  {a.responsavel && (
                                    <span className="text-blue-500/60">· {a.responsavel}</span>
                                  )}
                                  <span className="text-blue-500/50 ml-0.5">· {tempoAtras(a.data)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Consumíveis: mostrar qty baixada */}
                          {item.consumivel && item.quantidade_total > item.quantidade_disponivel && (
                            <p className="text-[11px] text-muted-foreground">
                              {qtdAlocada} {item.unidade} consumido{qtdAlocada !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs pt-3.5">{item.categoria ?? '—'}</td>
                    <td className={cn('px-4 py-3 text-right font-semibold pt-3.5', semEstoque ? 'text-red-500' : 'text-green-600')}>
                      {item.quantidade_disponivel} {item.unidade}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground pt-3.5">
                      {item.quantidade_total} {item.unidade}
                    </td>
                    <td className="px-4 py-3 pt-3">
                      <div className="flex gap-1 flex-wrap">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openModal('entrada', item)}>
                          <ArrowDownToLine className="w-3 h-3" />Entrada
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openModal('alocar', item)} disabled={semEstoque}>
                          <ArrowUpFromLine className="w-3 h-3" />{item.consumivel ? 'Baixa' : 'Alocar'}
                        </Button>
                        {!item.consumivel && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openModal('devolver', item)}>
                            <RotateCcw className="w-3 h-3" />Devolver
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => openModal('historico', item)}>
                          <History className="w-3 h-3" />Histórico
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal novo item */}
      <Dialog open={modal === 'novo-item'} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Novo Item</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={formItem.nome} onChange={(e) => setFormItem((p) => ({ ...p, nome: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Unidade</Label>
                <Input value={formItem.unidade} onChange={(e) => setFormItem((p) => ({ ...p, unidade: e.target.value }))} placeholder="un, m², kg..." />
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Input
                  list="categorias-list"
                  value={formItem.categoria}
                  onChange={(e) => setFormItem((p) => ({ ...p, categoria: e.target.value }))}
                  placeholder="Ex: Ferramentas, EPI..."
                />
                <datalist id="categorias-list">
                  {categorias.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor unitário (R$)</Label>
                <Input type="number" step="0.01" min="0" value={formItem.valor_unitario} onChange={(e) => setFormItem((p) => ({ ...p, valor_unitario: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Localização</Label>
                <Input value={formItem.localizacao} onChange={(e) => setFormItem((p) => ({ ...p, localizacao: e.target.value }))} placeholder="Galpão A, Prateleira 3..." />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formItem.consumivel}
                onChange={(e) => setFormItem((p) => ({ ...p, consumivel: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Item consumível (não retorna ao estoque)</span>
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modais de movimentação (entrada / alocar / devolver / baixa) */}
      {(['entrada', 'alocar', 'devolver', 'baixa'] as ModalType[]).map((tipo) => (
        <Dialog key={tipo} open={modal === tipo} onOpenChange={(o) => !o && setModal(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {tipo === 'entrada' ? 'Registrar Entrada'
                  : tipo === 'alocar' ? (selectedItem?.consumivel ? 'Registrar Baixa' : 'Alocar em Obra')
                  : tipo === 'devolver' ? 'Registrar Devolução'
                  : 'Registrar Baixa'}
              </DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4 pt-2">
                <div className="bg-muted/40 rounded-lg px-3 py-2 text-sm flex items-center justify-between">
                  <span className="font-medium">{selectedItem.nome}</span>
                  <span className="text-muted-foreground text-xs">
                    Disponível: <strong>{selectedItem.quantidade_disponivel} {selectedItem.unidade}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder={`em ${selectedItem.unidade}`}
                      value={formMov.quantidade}
                      onChange={(e) => setFormMov((p) => ({ ...p, quantidade: e.target.value }))}
                    />
                  </div>
                  {(tipo === 'alocar' || tipo === 'devolver') && (
                    <div className="space-y-1.5">
                      <Label>Obra</Label>
                      <Select value={formMov.obra_id} onValueChange={(v) => setFormMov((p) => ({ ...p, obra_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">Nenhuma</SelectItem>
                          {obras.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Responsável</Label>
                  <Input value={formMov.responsavel} onChange={(e) => setFormMov((p) => ({ ...p, responsavel: e.target.value }))} placeholder="Nome de quem está pegando/devolvendo" />
                </div>
                <div className="space-y-1.5">
                  <Label>Observação</Label>
                  <Input value={formMov.observacao} onChange={(e) => setFormMov((p) => ({ ...p, observacao: e.target.value }))} />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
                  <Button
                    disabled={saving}
                    onClick={() => handleMovimentacao(
                      tipo === 'entrada' ? 'ENTRADA'
                        : tipo === 'alocar' ? (selectedItem.consumivel ? 'BAIXA' : 'ALOCACAO')
                        : tipo === 'devolver' ? 'DEVOLUCAO'
                        : 'BAIXA'
                    )}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Confirmar
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      ))}

      {/* Modal histórico — timeline de movimentações */}
      <Dialog open={modal === 'historico'} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico — {selectedItem?.nome}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {itemHistorico.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Nenhuma movimentação registrada.
              </p>
            ) : (
              <div className="relative pl-5 space-y-0 pt-2 pb-2">
                {/* linha vertical da timeline */}
                <div className="absolute left-[9px] top-0 bottom-0 w-px bg-border" />

                {itemHistorico.map((m, idx) => {
                  const cfg = TIPO_MOV[m.tipo]
                  const Icon = cfg.icon
                  const isLast = idx === itemHistorico.length - 1
                  return (
                    <div key={m.id} className={cn('relative flex gap-3 pb-4', isLast && 'pb-0')}>
                      {/* bolinha */}
                      <div className={cn(
                        'absolute -left-5 flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 border-background mt-0.5',
                        cfg.bg,
                      )}>
                        <Icon className={cn('w-2.5 h-2.5', cfg.color)} />
                      </div>

                      <div className="flex-1 min-w-0 ml-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={cn('text-sm font-semibold', cfg.color)}>
                              {cfg.label}
                            </span>
                            <span className="text-sm text-foreground ml-2">
                              {m.quantidade} {selectedItem?.unidade}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(m.data + 'T12:00').toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60">{tempoAtras(m.data)}</p>
                          </div>
                        </div>

                        <div className="mt-0.5 space-y-0.5">
                          {m.obras?.nome && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{m.obras.nome}
                            </p>
                          )}
                          {m.responsavel && (
                            <p className="text-xs text-muted-foreground">
                              👤 {m.responsavel}
                            </p>
                          )}
                          {m.observacao && (
                            <p className="text-xs text-muted-foreground italic bg-muted/30 rounded px-1.5 py-0.5 mt-1">
                              {m.observacao}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
