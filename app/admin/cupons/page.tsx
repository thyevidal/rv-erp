'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Loader2, Ticket } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

type Coupon = {
  id: string
  codigo: string
  desconto_pct: number | null
  desconto_fixo: number | null
  max_usos: number | null
  usos: number
  validade: string | null
  ativo: boolean
  created_at: string
}

const EMPTY: Omit<Coupon, 'id' | 'created_at' | 'usos'> = {
  codigo: '',
  desconto_pct: null,
  desconto_fixo: null,
  max_usos: null,
  validade: null,
  ativo: true,
}

type FormState = {
  codigo: string
  desconto_pct: string
  desconto_fixo: string
  max_usos: string
  validade: string
  ativo: boolean
}

const EMPTY_FORM: FormState = {
  codigo: '',
  desconto_pct: '',
  desconto_fixo: '',
  max_usos: '',
  validade: '',
  ativo: true,
}

function couponToForm(c: Coupon): FormState {
  return {
    codigo: c.codigo,
    desconto_pct: c.desconto_pct != null ? String(c.desconto_pct) : '',
    desconto_fixo: c.desconto_fixo != null ? String(c.desconto_fixo) : '',
    max_usos: c.max_usos != null ? String(c.max_usos) : '',
    validade: c.validade ? c.validade.substring(0, 10) : '',
    ativo: c.ativo,
  }
}

function isExpired(validade: string | null) {
  if (!validade) return false
  return new Date(validade) < new Date()
}

export default function AdminCuponsPage() {
  const supabase = createClient()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM })
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons(data ?? [])
  }

  useEffect(() => { load() }, [])

  function openCreate() { setEditId(null); setForm({ ...EMPTY_FORM }); setOpen(true) }
  function openEdit(c: Coupon) { setEditId(c.id); setForm(couponToForm(c)); setOpen(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.codigo.trim()) { toast.error('Código é obrigatório'); return }
    if (!form.desconto_pct && !form.desconto_fixo) {
      toast.error('Informe desconto % ou desconto fixo'); return
    }

    setLoading(true)
    const payload = {
      codigo: form.codigo.trim().toUpperCase(),
      desconto_pct: form.desconto_pct ? Number(form.desconto_pct) : null,
      desconto_fixo: form.desconto_fixo ? Number(form.desconto_fixo) : null,
      max_usos: form.max_usos ? Number(form.max_usos) : null,
      validade: form.validade || null,
      ativo: form.ativo,
    }

    const { error } = editId
      ? await supabase.from('coupons').update(payload).eq('id', editId)
      : await supabase.from('coupons').insert(payload)

    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success(editId ? 'Cupom atualizado!' : 'Cupom criado!')
    setOpen(false)
    load()
  }

  async function toggleAtivo(c: Coupon) {
    await supabase.from('coupons').update({ ativo: !c.ativo }).eq('id', c.id)
    load()
  }

  const ativos = coupons.filter((c) => c.ativo && !isExpired(c.validade))
  const inativos = coupons.filter((c) => !c.ativo || isExpired(c.validade))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupons</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {ativos.length} ativo{ativos.length !== 1 ? 's' : ''} · {inativos.length} inativo{inativos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" />Novo Cupom</Button>
      </div>

      {coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Ticket className="w-10 h-10 opacity-30" />
          <p className="text-sm">Nenhum cupom cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => {
            const expired = isExpired(c.validade)
            const inactive = !c.ativo || expired
            const atLimit = c.max_usos != null && c.usos >= c.max_usos

            return (
              <Card key={c.id} className={`border-border/60 ${inactive ? 'opacity-50' : ''}`}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-primary shrink-0" />
                      <p className="font-mono font-bold text-sm tracking-widest">{c.codigo}</p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                      expired ? 'bg-orange-500/10 text-orange-600 border-orange-500/30'
                        : c.ativo ? 'bg-green-500/10 text-green-600 border-green-500/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {expired ? 'Expirado' : c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="text-2xl font-bold text-primary">
                    {c.desconto_pct != null
                      ? `${c.desconto_pct}% off`
                      : c.desconto_fixo != null
                      ? `${formatCurrency(c.desconto_fixo)} off`
                      : '—'}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Usos</span>
                      <span className={`font-medium ${atLimit ? 'text-destructive' : 'text-foreground'}`}>
                        {c.usos}{c.max_usos != null ? ` / ${c.max_usos}` : ' (ilimitado)'}
                      </span>
                    </div>
                    {c.validade && (
                      <div className="flex justify-between">
                        <span>Válido até</span>
                        <span className={`font-medium ${expired ? 'text-destructive' : 'text-foreground'}`}>
                          {new Date(c.validade).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={() => openEdit(c)}>
                      <Pencil className="w-3.5 h-3.5" />Editar
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1 text-muted-foreground" onClick={() => toggleAtivo(c)}>
                      {c.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Cupom' : 'Novo Cupom'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Código *</Label>
              <Input
                value={form.codigo}
                onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value.toUpperCase() }))}
                placeholder="EX: PROMO20"
                className="font-mono tracking-wider"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Desconto % </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="ex: 10"
                  value={form.desconto_pct}
                  onChange={(e) => setForm((p) => ({ ...p, desconto_pct: e.target.value, desconto_fixo: e.target.value ? '' : p.desconto_fixo }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Desconto fixo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="ex: 50"
                  value={form.desconto_fixo}
                  onChange={(e) => setForm((p) => ({ ...p, desconto_fixo: e.target.value, desconto_pct: e.target.value ? '' : p.desconto_pct }))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Preencha apenas um tipo de desconto.</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Máx. usos</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="ilimitado"
                  value={form.max_usos}
                  onChange={(e) => setForm((p) => ({ ...p, max_usos: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Validade</Label>
                <Input
                  type="date"
                  value={form.validade}
                  onChange={(e) => setForm((p) => ({ ...p, validade: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
