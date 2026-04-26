'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, calcBdiPrecoVenda } from '@/lib/utils'
import type { OrcamentoItem, BdiConfig, InsumoBase } from '@/types'
import {
  Plus, Trash2, ChevronDown, ChevronRight, Settings2, Loader2, FileSpreadsheet, Pencil, Search, X
} from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import OrcamentoPDFButton from '@/components/obras/OrcamentoPDFButton'

interface Props {
  obraId: string
  itens: OrcamentoItem[]
  bdi: BdiConfig | null
}

type ItemGroup = { etapa: string; itens: OrcamentoItem[] }

function groupByEtapa(itens: OrcamentoItem[]): ItemGroup[] {
  const map = new Map<string, OrcamentoItem[]>()
  for (const item of itens) {
    const arr = map.get(item.etapa) ?? []
    arr.push(item)
    map.set(item.etapa, arr)
  }
  return Array.from(map.entries()).map(([etapa, itens]) => ({ etapa, itens }))
}

const EMPTY_ROW: {
  id?: string
  etapa: string
  subetapa: string
  descricao: string
  unidade: string
  quantidade: string
  custo_unitario_aplicado: string
  tipo: 'MATERIAL' | 'MAO_DE_OBRA'
  observacao: string
  insumo_id?: string | null
} = {
  etapa: '', subetapa: '', descricao: '', unidade: 'un',
  quantidade: '', custo_unitario_aplicado: '', tipo: 'MATERIAL', observacao: '', insumo_id: null
}

export default function OrcamentoTab({ obraId, itens, bdi }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [addOpen, setAddOpen] = useState(false)
  const [bdiOpen, setBdiOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [row, setRow] = useState({ ...EMPTY_ROW })

  // Banco de insumos — autocomplete
  const [insumos, setInsumos] = useState<InsumoBase[]>([])
  const [insumoSearch, setInsumoSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [bdiForm, setBdiForm] = useState({
    impostos: bdi?.impostos ?? 8.65,
    margem_lucro: bdi?.margem_lucro ?? 15,
    seguros: bdi?.seguros ?? 1.5,
    custos_indiretos: bdi?.custos_indiretos ?? 5,
  })

  const bdiTotal = bdi?.bdi_total ?? (bdiForm.impostos + bdiForm.margem_lucro + bdiForm.seguros + bdiForm.custos_indiretos)
  const groups = groupByEtapa(itens)
  const totalCusto = itens.reduce((a, i) => a + i.quantidade * i.custo_unitario_aplicado, 0)
  const totalVenda = calcBdiPrecoVenda(totalCusto, bdiTotal)

  // Carrega insumos quando o dialog abre
  useEffect(() => {
    if (!addOpen) return
    supabase.from('insumos_base').select('*').order('descricao').then(({ data }) => {
      setInsumos(data ?? [])
    })
  }, [addOpen])

  // Filtra sugestões
  const sugestoes = insumoSearch.length >= 2
    ? insumos.filter((i) =>
      i.descricao.toLowerCase().includes(insumoSearch.toLowerCase()) ||
      (i.categoria ?? '').toLowerCase().includes(insumoSearch.toLowerCase())
    ).slice(0, 6)
    : []

  function selecionarInsumo(insumo: InsumoBase) {
    setRow((p) => ({
      ...p,
      descricao: insumo.descricao,
      unidade: insumo.unidade,
      custo_unitario_aplicado: String(insumo.custo_unitario),
      insumo_id: insumo.id,
    }))
    setInsumoSearch(insumo.descricao)
    setShowSuggestions(false)
  }

  function limparInsumo() {
    setInsumoSearch('')
    setRow((p) => ({ ...p, insumo_id: null }))
  }

  function setRow_(k: string, v: string) { setRow((p) => ({ ...p, [k]: v })) }

  function toggleCollapse(etapa: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(etapa) ? next.delete(etapa) : next.add(etapa)
      return next
    })
  }

  function openAddForEtapa(e: React.MouseEvent, etapa: string) {
    e.stopPropagation()
    setRow({ ...EMPTY_ROW, etapa })
    setInsumoSearch('')
    setAddOpen(true)
  }

  function openEditItem(item: OrcamentoItem) {
    setRow({
      id: item.id,
      etapa: item.etapa,
      subetapa: item.subetapa ?? '',
      descricao: item.descricao,
      unidade: item.unidade,
      quantidade: String(item.quantidade),
      custo_unitario_aplicado: String(item.custo_unitario_aplicado),
      tipo: item.tipo,
      observacao: item.observacao ?? '',
      insumo_id: item.insumo_id ?? null,
    })
    setInsumoSearch(item.descricao)
    setAddOpen(true)
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!row.descricao || !row.etapa) { toast.error('Informe etapa e descrição'); return }
    setLoading(true)

    const payload = {
      obra_id: obraId,
      etapa: row.etapa,
      subetapa: row.subetapa || null,
      descricao: row.descricao,
      unidade: row.unidade,
      quantidade: parseFloat(row.quantidade) || 0,
      custo_unitario_aplicado: parseFloat(row.custo_unitario_aplicado) || 0,
      tipo: row.tipo,
      observacao: row.observacao || null,
      insumo_id: row.insumo_id ?? null,
    }

    const { error } = row.id
      ? await supabase.from('orcamento_itens').update(payload).eq('id', row.id)
      : await supabase.from('orcamento_itens').insert(payload)

    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success(row.id ? 'Item atualizado!' : 'Item adicionado!')
    setAddOpen(false)
    setRow({ ...EMPTY_ROW })
    setInsumoSearch('')
    router.refresh()
  }

  async function handleDeleteItem(id: string) {
    const { error } = await supabase.from('orcamento_itens').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Item removido')
    router.refresh()
  }

  async function handleSaveBdi(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = { obra_id: obraId, ...bdiForm }
    const { error } = bdi
      ? await supabase.from('bdi_config').update(bdiForm).eq('id', bdi.id)
      : await supabase.from('bdi_config').insert(payload)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('BDI atualizado!')
    setBdiOpen(false)
    router.refresh()
  }

  async function handleXlsxImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: Record<string, string | number>[] = XLSX.utils.sheet_to_json(ws)

    const colMap: Record<string, string> = {
      'Etapa': 'etapa', 'ETAPA': 'etapa',
      'Descrição': 'descricao', 'DESCRIÇÃO': 'descricao', 'Descricao': 'descricao',
      'Unidade': 'unidade', 'UNIDADE': 'unidade',
      'Quantidade': 'quantidade', 'QTD': 'quantidade', 'Qtd': 'quantidade',
      'Preço': 'preco', 'Preco': 'preco', 'PREÇO': 'preco', 'Preço Unit.': 'preco', 'Custo': 'preco',
    }

    const inserts = rows.filter(r => r['Descrição'] || r['Descricao'] || r['DESCRIÇÃO']).map((r) => {
      const mapped: Record<string, string | number> = {}
      for (const [k, v] of Object.entries(r)) {
        const mappedKey = colMap[k]
        if (mappedKey) mapped[mappedKey] = v
      }
      return {
        obra_id: obraId,
        etapa: String(mapped.etapa ?? 'Importado'),
        descricao: String(mapped.descricao ?? ''),
        unidade: String(mapped.unidade ?? 'un'),
        quantidade: parseFloat(String(mapped.quantidade ?? 0)) || 0,
        custo_unitario_aplicado: parseFloat(String(mapped.preco ?? 0)) || 0,
        tipo: 'MATERIAL' as const,
      }
    }).filter(r => r.descricao)

    if (inserts.length === 0) { toast.error('Nenhuma linha válida encontrada'); return }
    const { error } = await supabase.from('orcamento_itens').insert(inserts)
    if (error) { toast.error(error.message); return }
    toast.success(`${inserts.length} itens importados!`)
    router.refresh()
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <Button size="sm" className="gap-1.5" onClick={() => {
            setRow({ ...EMPTY_ROW })
            setInsumoSearch('')
            setAddOpen(true)
          }}>
            <Plus className="w-3.5 h-3.5" /> Adicionar Item
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => fileRef.current?.click()}>
            <FileSpreadsheet className="w-3.5 h-3.5" /> Importar XLSX
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleXlsxImport} />
          <OrcamentoPDFButton obraId={obraId} />
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setBdiOpen(true)}>
          <Settings2 className="w-3.5 h-3.5" />
          BDI: {bdiTotal.toFixed(1)}%
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Custo Direto', value: formatCurrency(totalCusto), sub: 'Sem BDI' },
          { label: 'BDI', value: `${bdiTotal.toFixed(2)}%`, sub: 'Taxa aplicada' },
          { label: 'Preço de Venda', value: formatCurrency(totalVenda), sub: 'Com BDI' },
        ].map((c) => (
          <Card key={c.label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-lg font-bold mt-0.5">{c.value}</p>
              <p className="text-xs text-muted-foreground/60">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hierarchy Tree */}
      {groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Nenhum item no orçamento. Adicione itens ou importe uma planilha XLSX.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => {
            const isCollapsed = collapsed.has(group.etapa)
            const groupTotal = group.itens.reduce((a, i) => a + i.quantidade * i.custo_unitario_aplicado, 0)
            const mat = group.itens.filter((i) => i.tipo === 'MATERIAL')
            const mao = group.itens.filter((i) => i.tipo === 'MAO_DE_OBRA')
            return (
              <Card key={group.etapa} className="border-border/60 overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleCollapse(group.etapa)}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-semibold text-sm">{group.etapa}</span>
                    <Badge variant="secondary" className="text-[10px]">{group.itens.length} itens</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatCurrency(groupTotal)}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={(e) => openAddForEtapa(e, group.etapa)}
                      title="Adicionar item nesta etapa"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="border-t">
                    {mat.length > 0 && (
                      <div>
                        <div className="px-4 py-1.5 bg-muted/20 text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
                          Materiais
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-muted-foreground text-xs border-b">
                                <th className="text-left px-4 py-2 font-medium">Descrição</th>
                                <th className="text-center px-2 py-2 font-medium">Un.</th>
                                <th className="text-right px-2 py-2 font-medium">Qtd</th>
                                <th className="text-right px-2 py-2 font-medium">Custo Unit.</th>
                                <th className="text-right px-2 py-2 font-medium">Total Custo</th>
                                <th className="text-right px-4 py-2 font-medium">P. Venda</th>
                                <th className="px-2 py-2" />
                              </tr>
                            </thead>
                            <tbody>
                              {mat.map((item) => {
                                const tc = item.quantidade * item.custo_unitario_aplicado
                                const tv = calcBdiPrecoVenda(tc, bdiTotal)
                                return (
                                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-2.5">
                                      <div className="font-medium text-sm">{item.descricao}</div>
                                      {item.subetapa && <div className="text-xs text-muted-foreground">{item.subetapa}</div>}
                                    </td>
                                    <td className="text-center px-2 py-2.5 text-muted-foreground">{item.unidade}</td>
                                    <td className="text-right px-2 py-2.5">{item.quantidade}</td>
                                    <td className="text-right px-2 py-2.5">{formatCurrency(item.custo_unitario_aplicado)}</td>
                                    <td className="text-right px-2 py-2.5 font-medium">{formatCurrency(tc)}</td>
                                    <td className="text-right px-4 py-2.5 font-semibold text-primary">{formatCurrency(tv)}</td>
                                    <td className="px-2 py-2.5 flex items-center justify-end gap-1">
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                        onClick={() => openEditItem(item)}>
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDeleteItem(item.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {mao.length > 0 && (
                      <div>
                        <div className="px-4 py-1.5 bg-muted/20 text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
                          Mão de Obra / Empreiteira
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-muted-foreground text-xs border-b">
                                <th className="text-left px-4 py-2 font-medium">Descrição</th>
                                <th className="text-center px-2 py-2 font-medium">Un.</th>
                                <th className="text-right px-2 py-2 font-medium">Qtd</th>
                                <th className="text-right px-2 py-2 font-medium">Custo Unit.</th>
                                <th className="text-right px-2 py-2 font-medium">Total Custo</th>
                                <th className="text-right px-4 py-2 font-medium">P. Venda</th>
                                <th className="px-2 py-2" />
                              </tr>
                            </thead>
                            <tbody>
                              {mao.map((item) => {
                                const tc = item.quantidade * item.custo_unitario_aplicado
                                const tv = calcBdiPrecoVenda(tc, bdiTotal)
                                return (
                                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-2.5">
                                      <div className="font-medium text-sm">{item.descricao}</div>
                                      {item.subetapa && <div className="text-xs text-muted-foreground">{item.subetapa}</div>}
                                    </td>
                                    <td className="text-center px-2 py-2.5 text-muted-foreground">{item.unidade}</td>
                                    <td className="text-right px-2 py-2.5">{item.quantidade}</td>
                                    <td className="text-right px-2 py-2.5">{formatCurrency(item.custo_unitario_aplicado)}</td>
                                    <td className="text-right px-2 py-2.5 font-medium">{formatCurrency(tc)}</td>
                                    <td className="text-right px-4 py-2.5 font-semibold text-primary">{formatCurrency(tv)}</td>
                                    <td className="px-2 py-2.5 flex items-center justify-end gap-1">
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                        onClick={() => openEditItem(item)}>
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDeleteItem(item.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit Item Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) { setInsumoSearch(''); setShowSuggestions(false) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{row.id ? 'Editar Item' : 'Adicionar Item'}</DialogTitle></DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-3 pt-2">

            {/* Autocomplete banco de insumos */}
            <div className="space-y-1.5">
              <Label>Buscar no Banco de Insumos</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={insumoSearch}
                  onChange={(e) => {
                    setInsumoSearch(e.target.value)
                    setShowSuggestions(true)
                    // Se apagou tudo, limpa o vínculo
                    if (!e.target.value) setRow((p) => ({ ...p, insumo_id: null }))
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Digite para buscar um insumo cadastrado..."
                  className="pl-8 pr-8"
                />
                {insumoSearch && (
                  <button type="button" onClick={limparInsumo} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {showSuggestions && sugestoes.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden">
                    {sugestoes.map((insumo) => (
                      <button
                        key={insumo.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center justify-between gap-2"
                        onClick={() => selecionarInsumo(insumo)}
                      >
                        <div>
                          <span className="font-medium">{insumo.descricao}</span>
                          {insumo.categoria && <span className="text-xs text-muted-foreground ml-2">{insumo.categoria}</span>}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs text-muted-foreground">{insumo.unidade}</span>
                          <span className="text-xs font-semibold text-primary ml-2">{formatCurrency(insumo.custo_unitario)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {row.insumo_id && (
                <p className="text-xs text-green-500">✓ Vinculado ao banco de insumos</p>
              )}
              <p className="text-xs text-muted-foreground">Opcional — selecione para preencher automaticamente ou preencha manualmente abaixo.</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Etapa *</Label>
                <Input value={row.etapa} onChange={(e) => setRow_('etapa', e.target.value)} placeholder="Ex.: 1. Fundação" required />
              </div>
              <div className="space-y-1.5">
                <Label>Subetapa</Label>
                <Input value={row.subetapa} onChange={(e) => setRow_('subetapa', e.target.value)} placeholder="Ex.: 1.1 Escavação" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input value={row.descricao} onChange={(e) => setRow_('descricao', e.target.value)} placeholder="Nome do insumo/serviço" required />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Unidade</Label>
                <Input value={row.unidade} onChange={(e) => setRow_('unidade', e.target.value)} placeholder="un" />
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Input type="number" step="any" value={row.quantidade} onChange={(e) => setRow_('quantidade', e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Custo Unit. (R$)</Label>
                <Input type="number" step="any" value={row.custo_unitario_aplicado} onChange={(e) => setRow_('custo_unitario_aplicado', e.target.value)} placeholder="0,00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={row.tipo} onValueChange={(v) => setRow_('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MATERIAL">Material</SelectItem>
                  <SelectItem value="MAO_DE_OBRA">Mão de Obra / Empreiteira</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* BDI Dialog */}
      <Dialog open={bdiOpen} onOpenChange={setBdiOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Configurar BDI</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveBdi} className="space-y-3 pt-2">
            {[
              { label: 'Impostos (%)', key: 'impostos' },
              { label: 'Margem de Lucro (%)', key: 'margem_lucro' },
              { label: 'Seguros (%)', key: 'seguros' },
              { label: 'Custos Indiretos (%)', key: 'custos_indiretos' },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  type="number" step="0.01" min="0" max="99"
                  value={(bdiForm as Record<string, number>)[key]}
                  onChange={(e) => setBdiForm((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>BDI Total</span>
              <span className="text-primary">
                {(bdiForm.impostos + bdiForm.margem_lucro + bdiForm.seguros + bdiForm.custos_indiretos).toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Preço Venda = Custo ÷ (1 − BDI%)
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBdiOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>Salvar BDI</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}