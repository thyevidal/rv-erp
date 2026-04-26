'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import type { InsumoBase } from '@/types'
import { Plus, Search, Pencil, Trash2, Loader2, Package, ChevronDown, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'

interface Fornecedor {
  id: string
  insumo_id: string
  fornecedor: string
  preco_referencia: number
  contato: string | null
}

const EMPTY = { descricao: '', unidade: 'un', custo_unitario: '', categoria: '' }
const EMPTY_FORN = { fornecedor: '', preco_referencia: '', contato: '' }

export default function InsumosPage() {
  const supabase = createClient()
  const [insumos, setInsumos] = useState<InsumoBase[]>([])
  const [fornecedoresMap, setFornecedoresMap] = useState<Record<string, Fornecedor[]>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<InsumoBase | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [fornForm, setFornForm] = useState({ ...EMPTY_FORN })
  const [addingForn, setAddingForn] = useState(false)
  const [savingForn, setSavingForn] = useState(false)

  // Dialog de confirmação de atualização de orçamentos
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmData, setConfirmData] = useState<{
    insumoId: string
    novoPreco: number
    precoAntigo: number
    itens: Array<{ id: string; obra_nome: string; descricao: string }>
    payload: Record<string, unknown>
  } | null>(null)

  async function load() {
    setLoading(true)
    const [{ data: ins }, { data: forn }] = await Promise.all([
      supabase.from('insumos_base').select('*').order('descricao'),
      supabase.from('insumo_fornecedores').select('*').order('fornecedor'),
    ])
    setInsumos(ins ?? [])
    const map: Record<string, Fornecedor[]> = {}
    for (const f of forn ?? []) {
      if (!map[f.insumo_id]) map[f.insumo_id] = []
      map[f.insumo_id].push(f)
    }
    setFornecedoresMap(map)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }
  function setForn(k: string, v: string) { setFornForm((p) => ({ ...p, [k]: v })) }

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY })
    setOpen(true)
  }

  function openEdit(i: InsumoBase) {
    setEditing(i)
    setForm({ descricao: i.descricao, unidade: i.unidade, custo_unitario: String(i.custo_unitario), categoria: i.categoria ?? '' })
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descricao) { toast.error('Informe a descrição'); return }
    setSaving(true)

    const novoPreco = parseFloat(form.custo_unitario) || 0
    const payload = {
      descricao: form.descricao,
      unidade: form.unidade,
      custo_unitario: novoPreco,
      categoria: form.categoria || null,
    }

    // Se está editando e o preço mudou, verificar orçamentos em planejamento
    if (editing && novoPreco !== editing.custo_unitario) {
      const { data: itensVinculados } = await supabase
        .from('orcamento_itens')
        .select('id, descricao, obra_id, obras!inner(nome, status)')
        .eq('insumo_id', editing.id)
        .eq('obras.status', 'PLANEJAMENTO')

      if (itensVinculados && itensVinculados.length > 0) {
        setSaving(false)
        setConfirmData({
          insumoId: editing.id,
          novoPreco,
          precoAntigo: editing.custo_unitario,
          itens: itensVinculados.map((i) => ({
            id: i.id,
            obra_nome: (i.obras as unknown as { nome: string; status: string }).nome,
            descricao: i.descricao,
          })),
          payload: { ...payload, user_id: undefined },
        })
        setConfirmOpen(true)
        return
      }
    }

    await salvarInsumo(payload, editing?.id)
    setSaving(false)
  }

  async function salvarInsumo(payload: Record<string, unknown>, id?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const fullPayload = { ...payload, user_id: user!.id }

    const { error } = id
      ? await supabase.from('insumos_base').update(payload).eq('id', id)
      : await supabase.from('insumos_base').insert(fullPayload)

    if (error) { toast.error(error.message); return }
    toast.success(id ? 'Insumo atualizado!' : 'Insumo criado!')
    setOpen(false)
    load()
  }

  async function handleConfirmUpdate(atualizarOrcamentos: boolean) {
    if (!confirmData) return
    setSaving(true)

    await salvarInsumo(confirmData.payload, confirmData.insumoId)

    if (atualizarOrcamentos) {
      const ids = confirmData.itens.map((i) => i.id)
      const { error } = await supabase
        .from('orcamento_itens')
        .update({ custo_unitario_aplicado: confirmData.novoPreco })
        .in('id', ids)
      if (error) toast.error('Erro ao atualizar orçamentos: ' + error.message)
      else toast.success(`${ids.length} ${ids.length === 1 ? 'item atualizado' : 'itens atualizados'} nos orçamentos!`)
    }

    setSaving(false)
    setConfirmOpen(false)
    setConfirmData(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este insumo?')) return
    const { error } = await supabase.from('insumos_base').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Insumo removido')
    load()
  }

  async function handleAddFornecedor(insumoId: string) {
    if (!fornForm.fornecedor) { toast.error('Informe o nome do fornecedor'); return }
    setSavingForn(true)
    const { error } = await supabase.from('insumo_fornecedores').insert({
      insumo_id: insumoId,
      fornecedor: fornForm.fornecedor,
      preco_referencia: parseFloat(fornForm.preco_referencia) || 0,
      contato: fornForm.contato || null,
    })
    setSavingForn(false)
    if (error) { toast.error(error.message); return }
    toast.success('Fornecedor adicionado!')
    setFornForm({ ...EMPTY_FORN })
    setAddingForn(false)
    load()
  }

  async function handleDeleteFornecedor(id: string) {
    const { error } = await supabase.from('insumo_fornecedores').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Fornecedor removido')
    load()
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = insumos.filter((i) =>
    i.descricao.toLowerCase().includes(search.toLowerCase()) ||
    (i.categoria ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const categorias = [...new Set(insumos.map((i) => i.categoria).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banco de Insumos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Catálogo mestre de materiais e referências de preços.</p>
        </div>
        <Button className="gap-1.5" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Novo Insumo
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por descrição ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-14 text-center">
            <Package className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">{insumos.length === 0 ? 'Nenhum insumo cadastrado' : 'Nenhum resultado'}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr className="text-muted-foreground text-xs">
                  <th className="text-left px-4 py-2.5 font-medium w-6" />
                  <th className="text-left px-4 py-2.5 font-medium">Descrição</th>
                  <th className="text-left px-2 py-2.5 font-medium">Categoria</th>
                  <th className="text-center px-2 py-2.5 font-medium">Unidade</th>
                  <th className="text-right px-4 py-2.5 font-medium">Custo Unit.</th>
                  <th className="text-center px-2 py-2.5 font-medium">Fornecedores</th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((insumo) => {
                  const isExp = expanded.has(insumo.id)
                  const forns = fornecedoresMap[insumo.id] ?? []
                  return (
                    <>
                      <tr key={insumo.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <button onClick={() => toggleExpand(insumo.id)} className="text-muted-foreground hover:text-foreground">
                            {isExp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-medium">{insumo.descricao}</td>
                        <td className="px-2 py-3 text-muted-foreground text-xs">{insumo.categoria ?? '—'}</td>
                        <td className="text-center px-2 py-3 text-muted-foreground">{insumo.unidade}</td>
                        <td className="text-right px-4 py-3 font-semibold">{formatCurrency(insumo.custo_unitario)}</td>
                        <td className="text-center px-2 py-3">
                          <span className="text-xs text-muted-foreground">{forns.length > 0 ? `${forns.length} cadastrado${forns.length > 1 ? 's' : ''}` : '—'}</span>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(insumo)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(insumo.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Seção expandida de fornecedores */}
                      {isExp && (
                        <tr key={`${insumo.id}-forn`} className="bg-muted/10 border-b">
                          <td colSpan={7} className="px-8 py-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fornecedores</p>
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setAddingForn(true); setFornForm({ ...EMPTY_FORN }) }}>
                                  <Plus className="w-3 h-3" /> Adicionar
                                </Button>
                              </div>

                              {forns.length === 0 && !addingForn && (
                                <p className="text-xs text-muted-foreground">Nenhum fornecedor cadastrado para este insumo.</p>
                              )}

                              {forns.length > 0 && (
                                <div className="rounded-md border border-border/60 overflow-hidden">
                                  <table className="w-full text-xs">
                                    <thead className="bg-muted/30">
                                      <tr className="text-muted-foreground">
                                        <th className="text-left px-3 py-2 font-medium">Fornecedor</th>
                                        <th className="text-left px-3 py-2 font-medium">Contato</th>
                                        <th className="text-right px-3 py-2 font-medium">Preço Ref.</th>
                                        <th className="px-2 py-2" />
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {forns.map((f) => (
                                        <tr key={f.id} className="border-t hover:bg-muted/20">
                                          <td className="px-3 py-2 font-medium">{f.fornecedor}</td>
                                          <td className="px-3 py-2 text-muted-foreground">{f.contato ?? '—'}</td>
                                          <td className="px-3 py-2 text-right font-semibold text-primary">{formatCurrency(f.preco_referencia)}</td>
                                          <td className="px-2 py-2">
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDeleteFornecedor(f.id)}>
                                              <X className="w-3 h-3" />
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {addingForn && (
                                <div className="border border-border/60 rounded-md p-3 space-y-2 bg-background">
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Fornecedor *</Label>
                                      <Input className="h-8 text-xs" value={fornForm.fornecedor} onChange={(e) => setForn('fornecedor', e.target.value)} placeholder="Nome do fornecedor" />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Contato</Label>
                                      <Input className="h-8 text-xs" value={fornForm.contato} onChange={(e) => setForn('contato', e.target.value)} placeholder="Tel ou email" />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Preço Ref. (R$)</Label>
                                      <Input className="h-8 text-xs" type="number" step="any" value={fornForm.preco_referencia} onChange={(e) => setForn('preco_referencia', e.target.value)} placeholder="0,00" />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddingForn(false)}>Cancelar</Button>
                                    <Button size="sm" className="h-7 text-xs" disabled={savingForn} onClick={() => handleAddFornecedor(insumo.id)}>
                                      {savingForn && <Loader2 className="w-3 h-3 mr-1 animate-spin" />} Salvar
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dialog add/edit insumo */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editing ? 'Editar Insumo' : 'Novo Insumo'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input value={form.descricao} onChange={(e) => set('descricao', e.target.value)} placeholder="Ex.: Cimento CP-II 50kg" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Unidade</Label>
                <Input value={form.unidade} onChange={(e) => set('unidade', e.target.value)} placeholder="un, kg, m²..." />
              </div>
              <div className="space-y-1.5">
                <Label>Custo Unit. (R$)</Label>
                <Input type="number" step="any" value={form.custo_unitario} onChange={(e) => set('custo_unitario', e.target.value)} placeholder="0,00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input value={form.categoria} onChange={(e) => set('categoria', e.target.value)} placeholder="Ex.: Concreto, Aço..." list="cats" />
              <datalist id="cats">{categorias.map((c) => <option key={c} value={c!} />)}</datalist>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmação atualização orçamentos */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Atualizar orçamentos?</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground">
              O preço mudou de <strong>{formatCurrency(confirmData?.precoAntigo ?? 0)}</strong> para <strong className="text-primary">{formatCurrency(confirmData?.novoPreco ?? 0)}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Os itens abaixo estão em obras com status <strong>Planejamento</strong> e podem ser atualizados automaticamente:
            </p>
            <div className="rounded-md border border-border/60 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/30">
                  <tr className="text-muted-foreground">
                    <th className="text-left px-3 py-2 font-medium">Item</th>
                    <th className="text-left px-3 py-2 font-medium">Obra</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmData?.itens.map((i) => (
                    <tr key={i.id} className="border-t">
                      <td className="px-3 py-2">{i.descricao}</td>
                      <td className="px-3 py-2 text-muted-foreground">{i.obra_nome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">Obras em andamento, pausadas ou concluídas não serão afetadas.</p>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => handleConfirmUpdate(false)} disabled={saving}>
              Salvar sem atualizar
            </Button>
            <Button onClick={() => handleConfirmUpdate(true)} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Atualizar orçamentos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}