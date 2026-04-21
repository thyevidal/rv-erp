'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import type { InsumoBase } from '@/types'
import { Plus, Search, Pencil, Trash2, Loader2, Package } from 'lucide-react'
import { toast } from 'sonner'

const EMPTY = { descricao: '', unidade: 'un', custo_unitario: '', categoria: '' }

export default function InsumosPage() {
  const supabase = createClient()
  const [insumos, setInsumos] = useState<InsumoBase[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<InsumoBase | null>(null)
  const [form, setForm] = useState({ ...EMPTY })

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('insumos_base').select('*').order('descricao')
    setInsumos(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

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
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      descricao: form.descricao,
      unidade: form.unidade,
      custo_unitario: parseFloat(form.custo_unitario) || 0,
      categoria: form.categoria || null,
      user_id: user!.id,
    }
    const { error } = editing
      ? await supabase.from('insumos_base').update(payload).eq('id', editing.id)
      : await supabase.from('insumos_base').insert(payload)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(editing ? 'Insumo atualizado!' : 'Insumo criado!')
    setOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este insumo?')) return
    const { error } = await supabase.from('insumos_base').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Insumo removido')
    load()
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
          <p className="text-muted-foreground text-sm mt-0.5">
            Catálogo mestre de materiais e referências de preços.
          </p>
        </div>
        <Button className="gap-1.5" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Novo Insumo
        </Button>
      </div>

      {/* Buscas */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por descrição ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-14 text-center">
            <Package className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">
              {insumos.length === 0 ? 'Nenhum insumo cadastrado' : 'Nenhum resultado encontrado'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-muted-foreground text-xs border-b">
                  <th className="text-left px-4 py-3 font-medium">Descrição</th>
                  <th className="text-left px-2 py-3 font-medium">Categoria</th>
                  <th className="text-center px-2 py-3 font-medium">Unidade</th>
                  <th className="text-right px-2 py-3 font-medium">Custo Unit.</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((insumo) => (
                  <tr key={insumo.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{insumo.descricao}</td>
                    <td className="px-2 py-3 text-muted-foreground text-xs">{insumo.categoria ?? '—'}</td>
                    <td className="text-center px-2 py-3 text-muted-foreground">{insumo.unidade}</td>
                    <td className="text-right px-2 py-3 font-semibold">{formatCurrency(insumo.custo_unitario)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(insumo)}>
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(insumo.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Insumo' : 'Novo Insumo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input value={form.descricao} onChange={(e) => set('descricao', e.target.value)}
                placeholder="Ex.: Cimento CP-II 50kg" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Unidade</Label>
                <Input value={form.unidade} onChange={(e) => set('unidade', e.target.value)} placeholder="un, kg, m², etc." />
              </div>
              <div className="space-y-1.5">
                <Label>Custo Unit. (R$)</Label>
                <Input type="number" step="any" value={form.custo_unitario}
                  onChange={(e) => set('custo_unitario', e.target.value)} placeholder="0,00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input value={form.categoria} onChange={(e) => set('categoria', e.target.value)}
                placeholder="Ex.: Concreto, Aço, Alvenaria..." list="cats" />
              <datalist id="cats">
                {categorias.map((c) => <option key={c} value={c!} />)}
              </datalist>
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
    </div>
  )
}
