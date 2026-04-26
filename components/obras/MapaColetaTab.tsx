'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { OrcamentoItem, MapaColeta } from '@/types'
import { Plus, Check, Trash2, Loader2, Paperclip, Star, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

interface Fornecedor {
  id: string
  fornecedor: string
  preco_referencia: number
  contato: string | null
}

interface Props {
  obraId: string
  itens: OrcamentoItem[]
  coleta: MapaColeta[]
}

export default function MapaColetaTab({ obraId, itens, coleta }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<OrcamentoItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [fornecedoresSugeridos, setFornecedoresSugeridos] = useState<Fornecedor[]>([])
  const [salvarNoHistorico, setSalvarNoHistorico] = useState(false)

  const [form, setForm] = useState({
    fornecedor: '',
    valor_unitario: '',
    prazo_entrega: '',
    condicao_pagamento: '',
    observacao: '',
  })

  // Agrupa coleta por item
  const coletaMap = new Map<string, MapaColeta[]>()
  for (const c of coleta) {
    const arr = coletaMap.get(c.orcamento_item_id) ?? []
    arr.push(c)
    coletaMap.set(c.orcamento_item_id, arr)
  }

  // Todos os itens (material + mão de obra)
  const todosItens = itens

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function openAdd(item: OrcamentoItem) {
    setSelectedItem(item)
    setForm({ fornecedor: '', valor_unitario: '', prazo_entrega: '', condicao_pagamento: '', observacao: '' })
    setSalvarNoHistorico(false)
    setFornecedoresSugeridos([])

    // Se o item tem insumo vinculado, busca fornecedores do banco
    if (item.insumo_id) {
      const { data } = await supabase
        .from('insumo_fornecedores')
        .select('*')
        .eq('insumo_id', item.insumo_id)
        .order('preco_referencia')
      setFornecedoresSugeridos(data ?? [])
    }

    setAddOpen(true)
  }

  function selecionarFornecedorSugerido(f: Fornecedor) {
    setForm((p) => ({
      ...p,
      fornecedor: f.fornecedor,
      valor_unitario: String(f.preco_referencia),
    }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItem || !form.fornecedor) { toast.error('Informe o fornecedor'); return }

    const cotacoesAtuais = coletaMap.get(selectedItem.id) ?? []
    if (cotacoesAtuais.length >= 3) { toast.error('Máximo de 3 cotações por item'); return }

    setLoading(true)

    const { error } = await supabase.from('mapa_coleta').insert({
      orcamento_item_id: selectedItem.id,
      obra_id: obraId,
      fornecedor: form.fornecedor,
      valor_unitario: parseFloat(form.valor_unitario) || 0,
      prazo_entrega: parseInt(form.prazo_entrega) || null,
      condicao_pagamento: form.condicao_pagamento || null,
      observacao: form.observacao || null,
      selecionado: false,
    })

    if (error) { toast.error(error.message); setLoading(false); return }

    // Salvar no histórico do banco de insumos se solicitado
    if (salvarNoHistorico && selectedItem.insumo_id) {
      const preco = parseFloat(form.valor_unitario) || 0
      // Verifica se já existe esse fornecedor para esse insumo
      const { data: existente } = await supabase
        .from('insumo_fornecedores')
        .select('id')
        .eq('insumo_id', selectedItem.insumo_id)
        .ilike('fornecedor', form.fornecedor)
        .maybeSingle()

      if (existente) {
        // Atualiza o preço de referência
        await supabase
          .from('insumo_fornecedores')
          .update({ preco_referencia: preco })
          .eq('id', existente.id)
        toast.success('Cotação adicionada e preço de referência atualizado no banco!')
      } else {
        // Cria novo fornecedor no banco de insumos
        await supabase.from('insumo_fornecedores').insert({
          insumo_id: selectedItem.insumo_id,
          fornecedor: form.fornecedor,
          preco_referencia: preco,
          contato: null,
        })
        toast.success('Cotação adicionada e fornecedor salvo no banco de insumos!')
      }
    } else {
      toast.success('Cotação adicionada!')
    }

    setLoading(false)
    setAddOpen(false)
    router.refresh()
  }

  async function handleSelect(coletaId: string, itemId: string) {
    const coletasDoItem = coletaMap.get(itemId) ?? []
    await Promise.all(
      coletasDoItem.map((c) =>
        supabase.from('mapa_coleta').update({ selecionado: c.id === coletaId }).eq('id', c.id)
      )
    )
    toast.success('Fornecedor selecionado!')
    router.refresh()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('mapa_coleta').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    router.refresh()
  }

  async function handleUpload(coletaId: string, file: File) {
    setUploadingFor(coletaId)
    const path = `${obraId}/${coletaId}/${file.name}`
    const { error: uploadErr } = await supabase.storage
      .from('coleta-anexos').upload(path, file, { upsert: true })
    if (uploadErr) { toast.error(uploadErr.message); setUploadingFor(null); return }
    const { data: { publicUrl } } = supabase.storage.from('coleta-anexos').getPublicUrl(path)
    await supabase.from('mapa_coleta').update({ anexo_url: publicUrl }).eq('id', coletaId)
    setUploadingFor(null)
    toast.success('Anexo enviado!')
    router.refresh()
  }

  if (todosItens.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Adicione itens ao orçamento para criar cotações.
        </CardContent>
      </Card>
    )
  }

  // Resumo geral
  const totalSelecionado = todosItens.reduce((acc, item) => {
    const cotacoes = coletaMap.get(item.id) ?? []
    const vencedor = cotacoes.find((c) => c.selecionado)
    if (!vencedor) return acc
    return acc + vencedor.valor_unitario * item.quantidade
  }, 0)

  const itensCotados = todosItens.filter((i) => (coletaMap.get(i.id) ?? []).length > 0).length
  const itensComVencedor = todosItens.filter((i) => (coletaMap.get(i.id) ?? []).some((c) => c.selecionado)).length

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Itens cotados</p>
            <p className="text-lg font-bold mt-0.5">{itensCotados} / {todosItens.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Vencedores definidos</p>
            <p className="text-lg font-bold mt-0.5">{itensComVencedor} / {todosItens.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total cotado (vencedores)</p>
            <p className="text-lg font-bold mt-0.5 text-primary">{formatCurrency(totalSelecionado)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de itens */}
      <div className="space-y-2">
        {todosItens.map((item) => {
          const cotacoes = (coletaMap.get(item.id) ?? []).slice(0, 3)
          const selecionado = cotacoes.find((c) => c.selecionado)
          const isCollapsed = collapsed.has(item.id)
          const menorPreco = cotacoes.length > 0
            ? cotacoes.reduce((min, c) => c.valor_unitario < min.valor_unitario ? c : min, cotacoes[0])
            : null

          return (
            <Card key={item.id} className="border-border/60 overflow-hidden">
              {/* Header do item */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => toggleCollapse(item.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isCollapsed
                    ? <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{item.descricao}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {item.tipo === 'MATERIAL' ? 'Material' : 'Mão de Obra'}
                      </Badge>
                      {item.insumo_id && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-400 border-blue-400/30">
                          <BookOpen className="w-2.5 h-2.5 mr-1" />Banco
                        </Badge>
                      )}
                      {selecionado && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-green-500/15 text-green-400 border-green-500/30">
                          <Check className="w-2.5 h-2.5 mr-1" />Vencedor: {selecionado.fornecedor}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.etapa} · {item.quantidade} {item.unidade} · Ref: {formatCurrency(item.custo_unitario_aplicado)}/un
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {cotacoes.length < 3 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={(e) => { e.stopPropagation(); openAdd(item) }}
                    >
                      <Plus className="w-3 h-3" /> Cotação
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground">{cotacoes.length}/3</span>
                </div>
              </div>

              {/* Cotações expandidas */}
              {!isCollapsed && (
                <div className="border-t">
                  {cotacoes.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground text-xs">
                      Nenhuma cotação adicionada ainda
                    </div>
                  ) : (
                    <div
                      className="grid divide-x border-border/40"
                      style={{ gridTemplateColumns: `repeat(${cotacoes.length}, 1fr)` }}
                    >
                      {cotacoes.map((c) => {
                        const isMelhor = menorPreco?.id === c.id && cotacoes.length > 1
                        const totalItem = c.valor_unitario * item.quantidade
                        return (
                          <div key={c.id} className={`p-4 space-y-3 ${c.selecionado ? 'bg-primary/5' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-sm">{c.fornecedor}</p>
                                {isMelhor && (
                                  <span className="text-[10px] text-green-400 font-medium flex items-center gap-0.5 mt-0.5">
                                    <Star className="w-2.5 h-2.5" /> Menor preço
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                  title="Anexar documento"
                                  onClick={() => {
                                    fileRef.current?.setAttribute('data-coleta-id', c.id)
                                    fileRef.current?.click()
                                  }}
                                >
                                  {uploadingFor === c.id
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <Paperclip className="w-3 h-3" />
                                  }
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => handleDelete(c.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Unit.</span>
                                <span className="font-semibold">{formatCurrency(c.valor_unitario)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Total ({item.quantidade} {item.unidade})</span>
                                <span className="font-semibold text-primary">{formatCurrency(totalItem)}</span>
                              </div>
                              {c.prazo_entrega && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Prazo</span>
                                  <span>{c.prazo_entrega} dias</span>
                                </div>
                              )}
                              {c.condicao_pagamento && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Pagamento</span>
                                  <span>{c.condicao_pagamento}</span>
                                </div>
                              )}
                              {c.observacao && (
                                <div className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                                  {c.observacao}
                                </div>
                              )}
                              {c.anexo_url && (
                                <a
                                  href={c.anexo_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary flex items-center gap-1 pt-1"
                                >
                                  <Paperclip className="w-3 h-3" /> Ver anexo
                                </a>
                              )}
                            </div>

                            <Button
                              size="sm"
                              variant={c.selecionado ? 'default' : 'outline'}
                              className={`w-full gap-1.5 h-8 text-xs ${c.selecionado ? 'bg-primary' : ''}`}
                              onClick={() => handleSelect(c.id, item.id)}
                            >
                              {c.selecionado && <Check className="w-3 h-3" />}
                              {c.selecionado ? 'Selecionado' : 'Selecionar vencedor'}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Input de upload oculto */}
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          const coletaId = fileRef.current?.getAttribute('data-coleta-id')
          if (file && coletaId) handleUpload(coletaId, file)
          if (fileRef.current) fileRef.current.value = ''
        }}
      />

      {/* Dialog de nova cotação */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Cotação</DialogTitle>
            {selectedItem && (
              <p className="text-sm text-muted-foreground pt-1">
                {selectedItem.descricao} · {selectedItem.quantidade} {selectedItem.unidade}
              </p>
            )}
          </DialogHeader>

          <form onSubmit={handleAdd} className="space-y-3 pt-1">

            {/* Sugestões do banco de insumos */}
            {fornecedoresSugeridos.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Fornecedores do banco de insumos</Label>
                <div className="space-y-1">
                  {fornecedoresSugeridos.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm rounded-md border border-border/60 hover:bg-muted/40 hover:border-primary/40 transition-colors flex items-center justify-between gap-2"
                      onClick={() => selecionarFornecedorSugerido(f)}
                    >
                      <div>
                        <span className="font-medium">{f.fornecedor}</span>
                        {f.contato && <span className="text-xs text-muted-foreground ml-2">{f.contato}</span>}
                      </div>
                      <span className="text-xs font-semibold text-primary shrink-0">
                        {formatCurrency(f.preco_referencia)}/un
                      </span>
                    </button>
                  ))}
                </div>
                <Separator />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Fornecedor *</Label>
              <Input
                value={form.fornecedor}
                onChange={(e) => set('fornecedor', e.target.value)}
                placeholder="Nome do fornecedor"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Valor Unit. (R$)</Label>
              <Input
                type="number"
                step="any"
                value={form.valor_unitario}
                onChange={(e) => set('valor_unitario', e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prazo (dias)</Label>
                <Input
                  type="number"
                  value={form.prazo_entrega}
                  onChange={(e) => set('prazo_entrega', e.target.value)}
                  placeholder="Ex.: 7"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cond. Pagamento</Label>
                <Input
                  value={form.condicao_pagamento}
                  onChange={(e) => set('condicao_pagamento', e.target.value)}
                  placeholder="Ex.: 30/60 dd"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Observação</Label>
              <Input
                value={form.observacao}
                onChange={(e) => set('observacao', e.target.value)}
                placeholder="Observações sobre a cotação..."
              />
            </div>

            {/* Salvar no histórico */}
            {selectedItem?.insumo_id && (
              <div
                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${salvarNoHistorico ? 'border-primary/40 bg-primary/5' : 'border-border/60 hover:bg-muted/30'
                  }`}
                onClick={() => setSalvarNoHistorico((p) => !p)}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${salvarNoHistorico ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                  {salvarNoHistorico && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <div>
                  <p className="text-xs font-medium">Salvar no banco de insumos</p>
                  <p className="text-xs text-muted-foreground">Atualiza o preço de referência deste fornecedor para uso futuro</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}