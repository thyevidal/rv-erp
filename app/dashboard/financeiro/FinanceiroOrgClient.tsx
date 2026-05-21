'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

type Lancamento = {
  id: string
  data: string
  descricao: string
  obra_id: string | null
  tipo: 'ENTRADA' | 'SAIDA'
  categoria: string
  valor: number
  obras?: { nome: string } | null
}

type Obra = { id: string; nome: string }

interface Props {
  lancamentos: Lancamento[]
  obras: Obra[]
  orgId: string
  userId: string
}

const CATEGORIAS = ['Material', 'Mão de Obra', 'Equipamento', 'Serviço', 'Imposto', 'Receita', 'Outro']

export default function FinanceiroOrgClient({ lancamentos, obras, orgId, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [filterObra, setFilterObra] = useState('all')
  const [filterTipo, setFilterTipo] = useState('all')
  const [filterPeriodo, setFilterPeriodo] = useState('')

  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    tipo: 'SAIDA' as 'ENTRADA' | 'SAIDA',
    categoria: 'Outro',
    valor: '',
    obra_id: '_none_',
  })

  const filtered = useMemo(() => {
    return lancamentos.filter((l) => {
      if (filterObra !== 'all' && l.obra_id !== (filterObra === 'none' ? null : filterObra)) return false
      if (filterTipo !== 'all' && l.tipo !== filterTipo) return false
      if (filterPeriodo && !l.data.startsWith(filterPeriodo)) return false
      return true
    })
  }, [lancamentos, filterObra, filterTipo, filterPeriodo])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descricao || !form.valor) { toast.error('Preencha todos os campos'); return }
    setSaving(true)
    const { error } = await supabase.from('financeiro_lancamentos').insert({
      obra_id: form.obra_id === '_none_' ? null : form.obra_id,
      data: form.data,
      descricao: form.descricao,
      tipo: form.tipo,
      categoria: form.categoria,
      valor: parseFloat(form.valor.replace(',', '.')),
      forma_pagamento: null,
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Lançamento criado!')
    setOpen(false)
    setForm({ data: new Date().toISOString().split('T')[0], descricao: '', tipo: 'SAIDA', categoria: 'Outro', valor: '', obra_id: '_none_' })
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold">Lançamentos Consolidados</h2>
        <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="w-3.5 h-3.5" />Novo lançamento
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterObra} onValueChange={setFilterObra}>
          <SelectTrigger className="h-8 w-44 text-sm"><SelectValue placeholder="Todas as obras" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as obras</SelectItem>
            <SelectItem value="none">Sem obra</SelectItem>
            {obras.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ENTRADA">Entradas</SelectItem>
            <SelectItem value="SAIDA">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="month"
          className="h-8 w-36 text-sm"
          value={filterPeriodo}
          onChange={(e) => setFilterPeriodo(e.target.value)}
          placeholder="Período"
        />
        {(filterObra !== 'all' || filterTipo !== 'all' || filterPeriodo) && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() => { setFilterObra('all'); setFilterTipo('all'); setFilterPeriodo('') }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Tabela */}
      <div className="border border-border/60 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left text-muted-foreground text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Obra</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((l) => (
                <tr key={l.id} className="border-t border-border/60 hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(l.data + 'T12:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{l.descricao}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {l.obras?.nome ?? <span className="italic text-muted-foreground/60">Sem obra</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{l.categoria}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold flex items-center justify-end gap-1 ${l.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-500'}`}>
                      {l.tipo === 'ENTRADA'
                        ? <ArrowUpCircle className="w-3.5 h-3.5" />
                        : <ArrowDownCircle className="w-3.5 h-3.5" />}
                      {formatCurrency(l.valor)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog novo lançamento */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((p) => ({ ...p, tipo: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRADA">Entrada</SelectItem>
                    <SelectItem value="SAIDA">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Input type="date" value={form.data} onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.valor}
                  onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm((p) => ({ ...p, categoria: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Obra (opcional)</Label>
              <Select value={form.obra_id} onValueChange={(v) => setForm((p) => ({ ...p, obra_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sem obra vinculada" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Sem obra</SelectItem>
                  {obras.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
