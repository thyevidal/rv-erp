'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import type { OrcamentoItem, MapaColeta } from '@/types'
import { Plus, Upload, Check, Trash2, Loader2, Paperclip } from 'lucide-react'
import { toast } from 'sonner'

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
  const [form, setForm] = useState({
    fornecedor: '', valor_unitario: '', prazo_entrega: '', condicao_pagamento: ''
  })

  // Group coleta by orcamento_item_id
  const coletaMap = new Map<string, MapaColeta[]>()
  for (const c of coleta) {
    const arr = coletaMap.get(c.orcamento_item_id) ?? []
    arr.push(c)
    coletaMap.set(c.orcamento_item_id, arr)
  }

  const itensMaterial = itens.filter((i) => i.tipo === 'MATERIAL')

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  function openAdd(item: OrcamentoItem) {
    setSelectedItem(item)
    setForm({ fornecedor: '', valor_unitario: '', prazo_entrega: '', condicao_pagamento: '' })
    setAddOpen(true)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItem || !form.fornecedor) { toast.error('Informe o fornecedor'); return }
    setLoading(true)
    const { error } = await supabase.from('mapa_coleta').insert({
      orcamento_item_id: selectedItem.id,
      obra_id: obraId,
      fornecedor: form.fornecedor,
      valor_unitario: parseFloat(form.valor_unitario) || 0,
      prazo_entrega: parseInt(form.prazo_entrega) || null,
      condicao_pagamento: form.condicao_pagamento || null,
      selecionado: false,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Cotação adicionada!')
    setAddOpen(false)
    router.refresh()
  }

  async function handleSelect(coletaId: string, itemId: string) {
    // Deselect all for this item, then select this one
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

  if (itensMaterial.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Adicione itens de tipo <strong>Material</strong> ao orçamento para criar cotações.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Compare até 3 fornecedores por item. Selecione o vencedor para registrar a melhor cotação.
      </p>

      {itensMaterial.map((item) => {
        const cotacoes = (coletaMap.get(item.id) ?? []).slice(0, 3)
        const selecionado = cotacoes.find((c) => c.selecionado)
        const menorPreco = cotacoes.reduce((min, c) =>
          !min || c.valor_unitario < min.valor_unitario ? c : min, null as MapaColeta | null
        )

        return (
          <Card key={item.id} className="border-border/60 overflow-hidden">
            <CardHeader className="pb-3 bg-muted/20 border-b">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold">{item.descricao}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.etapa} · {item.quantidade} {item.unidade} · Ref: {formatCurrency(item.custo_unitario_aplicado)}/un
                  </p>
                </div>
                {cotacoes.length < 3 && (
                  <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => openAdd(item)}>
                    <Plus className="w-3.5 h-3.5" /> Cotação
                  </Button>
                )}
              </div>
            </CardHeader>

            {cotacoes.length === 0 ? (
              <CardContent className="py-6 text-center text-muted-foreground text-xs">
                Nenhuma cotação adicionada ainda
              </CardContent>
            ) : (
              <CardContent className="p-0">
                <div className="flex overflow-x-auto divide-x snap-x snap-mandatory pb-2 sm:pb-0">
                  {cotacoes.map((c) => {
                    const isMelhor = menorPreco?.id === c.id
                    return (
                      <div key={c.id} className={`p-4 space-y-2 min-w-[260px] sm:min-w-[33%] shrink-0 snap-start ${c.selecionado ? 'bg-primary/5' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm">{c.fornecedor}</p>
                            {isMelhor && (
                              <span className="text-[10px] text-green-400 font-medium">✓ Menor preço</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6"
                              onClick={() => fileRef.current?.click()}
                              title="Anexar documento">
                              {uploadingFor === c.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Upload className="w-3 h-3 text-muted-foreground" />
                              }
                            </Button>
                            <input
                              type="file" className="hidden" ref={fileRef}
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => { if (e.target.files?.[0]) handleUpload(c.id, e.target.files[0]) }}
                            />
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(c.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-xl font-bold text-foreground">{formatCurrency(c.valor_unitario)}<span className="text-xs text-muted-foreground font-normal">/{item.unidade}</span></p>
                        <p className="text-xs text-muted-foreground">
                          Total: <strong>{formatCurrency(c.valor_unitario * item.quantidade)}</strong>
                        </p>
                        {c.prazo_entrega && <p className="text-xs text-muted-foreground">Prazo: {c.prazo_entrega} dias</p>}
                        {c.condicao_pagamento && <p className="text-xs text-muted-foreground">{c.condicao_pagamento}</p>}
                        {c.anexo_url && (
                          <a href={c.anexo_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <Paperclip className="w-3 h-3" /> Anexo
                          </a>
                        )}

                        <Button
                          size="sm" variant={c.selecionado ? 'default' : 'outline'}
                          className={`w-full gap-1.5 mt-2 h-8 text-xs ${c.selecionado ? 'bg-primary' : ''}`}
                          onClick={() => handleSelect(c.id, item.id)}
                        >
                          {c.selecionado && <Check className="w-3 h-3" />}
                          {c.selecionado ? 'Selecionado' : 'Selecionar'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Cotação</DialogTitle>
            {selectedItem && (
              <p className="text-sm text-muted-foreground pt-1">{selectedItem.descricao}</p>
            )}
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Fornecedor *</Label>
              <Input value={form.fornecedor} onChange={(e) => set('fornecedor', e.target.value)} placeholder="Nome do fornecedor" required />
            </div>
            <div className="space-y-1.5">
              <Label>Valor Unit. (R$)</Label>
              <Input type="number" step="any" value={form.valor_unitario} onChange={(e) => set('valor_unitario', e.target.value)} placeholder="0,00" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prazo (dias)</Label>
                <Input type="number" value={form.prazo_entrega} onChange={(e) => set('prazo_entrega', e.target.value)} placeholder="Ex.: 7" />
              </div>
              <div className="space-y-1.5">
                <Label>Cond. Pagamento</Label>
                <Input value={form.condicao_pagamento} onChange={(e) => set('condicao_pagamento', e.target.value)} placeholder="Ex.: 30/60 dd" />
              </div>
            </div>
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
