'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

type Plan = { id: string; nome: string; descricao: string | null; preco_mensal: number; max_obras: number; ativo: boolean; created_at: string }

const EMPTY: Omit<Plan, 'id' | 'created_at'> = { nome: '', descricao: '', preco_mensal: 0, max_obras: 1, ativo: true }

export default function AdminPlanosPage() {
  const supabase = createClient()
  const [plans, setPlans] = useState<Plan[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    const { data } = await supabase.from('plans').select('*').order('preco_mensal')
    setPlans(data ?? [])
  }

  useEffect(() => { load() }, [])

  function openCreate() { setEditId(null); setForm({ ...EMPTY }); setOpen(true) }
  function openEdit(p: Plan) { setEditId(p.id); setForm({ nome: p.nome, descricao: p.descricao ?? '', preco_mensal: p.preco_mensal, max_obras: p.max_obras, ativo: p.ativo }); setOpen(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = { ...form, preco_mensal: Number(form.preco_mensal), max_obras: Number(form.max_obras) }
    const { error } = editId
      ? await supabase.from('plans').update(payload).eq('id', editId)
      : await supabase.from('plans').insert(payload)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success(editId ? 'Plano atualizado!' : 'Plano criado!')
    setOpen(false)
    load()
  }

  async function toggleAtivo(p: Plan) {
    await supabase.from('plans').update({ ativo: !p.ativo }).eq('id', p.id)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie os planos disponíveis no sistema.</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" />Novo Plano</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className={`border-border/60 ${!p.ativo ? 'opacity-50' : ''}`}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{p.nome}</p>
                  {p.descricao && <p className="text-xs text-muted-foreground mt-0.5">{p.descricao}</p>}
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${p.ativo ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground border-border'}`}>
                  {p.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {p.preco_mensal === 0 ? 'Grátis' : `${formatCurrency(p.preco_mensal)}/mês`}
              </div>
              <div className="text-sm text-muted-foreground">
                Limite: <strong>{p.max_obras === -1 ? 'Ilimitado' : `${p.max_obras} obra${p.max_obras > 1 ? 's' : ''}`}</strong>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={() => openEdit(p)}>
                  <Pencil className="w-3.5 h-3.5" />Editar
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 text-muted-foreground" onClick={() => toggleAtivo(p)}>
                  {p.ativo ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? 'Editar Plano' : 'Novo Plano'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={form.descricao ?? ''} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preço Mensal (R$)</Label>
                <Input type="number" step="0.01" min="0" value={form.preco_mensal} onChange={(e) => setForm((p) => ({ ...p, preco_mensal: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Máx. Obras (-1 = ∞)</Label>
                <Input type="number" min="-1" value={form.max_obras} onChange={(e) => setForm((p) => ({ ...p, max_obras: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
