'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

const FEATURE_LABELS: Record<string, string> = {
  banco_insumos: 'Banco de Insumos',
  agenda: 'Agenda Central',
  financeiro_org: 'Financeiro da Organização',
  estoque: 'Controle de Estoque',
  aquisicao_construcao: 'Aquisição & Construção (Caixa)',
  relatorio_pdf: 'Relatório PDF',
  multiplos_membros: 'Múltiplos Membros',
}

const FEATURE_KEYS = Object.keys(FEATURE_LABELS)

type Promotion = {
  id: string
  plan_id: string
  descricao: string
  desconto_pct: number
  inicio: string
  fim: string
  ativo: boolean
  created_at: string
}

type Plan = {
  id: string
  nome: string
  descricao: string | null
  preco_mensal: number
  max_obras: number
  ativo: boolean
  features: Record<string, boolean>
  created_at: string
  plan_promotions: Promotion[]
}

const EMPTY_PLAN = {
  nome: '',
  descricao: '',
  preco_mensal: 0,
  max_obras: 1,
  ativo: true,
  features: Object.fromEntries(FEATURE_KEYS.map((k) => [k, false])),
}

function defaultFeatures(features: Record<string, boolean> | null | undefined): Record<string, boolean> {
  return Object.fromEntries(FEATURE_KEYS.map((k) => [k, features?.[k] ?? false]))
}

export default function AdminPlanosPage() {
  const supabase = createClient()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  // Dialog for new plan
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_PLAN })
  const [saving, setSaving] = useState(false)

  // Per-plan edit states
  const [editStates, setEditStates] = useState<Record<string, { nome: string; descricao: string; preco_mensal: number; max_obras: number; ativo: boolean; features: Record<string, boolean> }>>({})
  const [savingPlan, setSavingPlan] = useState<string | null>(null)

  // Promotions per plan
  const [expandedPromos, setExpandedPromos] = useState<Record<string, boolean>>({})
  const [newPromoForms, setNewPromoForms] = useState<Record<string, { descricao: string; desconto_pct: string; inicio: string; fim: string } | null>>({})
  const [savingPromo, setSavingPromo] = useState<string | null>(null)

  async function load() {
    setLoadingPlans(true)
    const { data } = await supabase.from('plans').select('*, plan_promotions(*)').order('preco_mensal')
    const loaded = (data ?? []) as Plan[]
    setPlans(loaded)
    // Init edit states
    const states: typeof editStates = {}
    for (const p of loaded) {
      states[p.id] = {
        nome: p.nome,
        descricao: p.descricao ?? '',
        preco_mensal: p.preco_mensal,
        max_obras: p.max_obras,
        ativo: p.ativo,
        features: defaultFeatures(p.features),
      }
    }
    setEditStates(states)
    setLoadingPlans(false)
  }

  useEffect(() => { load() }, [])

  // Create new plan
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('plans').insert({
      nome: form.nome,
      descricao: form.descricao || null,
      preco_mensal: Number(form.preco_mensal),
      max_obras: Number(form.max_obras),
      ativo: form.ativo,
      features: form.features,
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Plano criado!')
    setOpen(false)
    setForm({ ...EMPTY_PLAN })
    load()
  }

  // Save plan inline
  async function handleSavePlan(planId: string) {
    const s = editStates[planId]
    if (!s) return
    setSavingPlan(planId)
    const { error } = await supabase.from('plans').update({
      nome: s.nome,
      descricao: s.descricao || null,
      preco_mensal: Number(s.preco_mensal),
      max_obras: Number(s.max_obras),
      ativo: s.ativo,
      features: s.features,
    }).eq('id', planId)
    setSavingPlan(null)
    if (error) { toast.error(error.message); return }
    toast.success('Plano salvo!')
    load()
  }

  function updateEdit(planId: string, patch: Partial<typeof editStates[string]>) {
    setEditStates((prev) => ({ ...prev, [planId]: { ...prev[planId], ...patch } }))
  }

  function toggleFeature(planId: string, key: string) {
    const current = editStates[planId]?.features ?? {}
    updateEdit(planId, { features: { ...current, [key]: !current[key] } })
  }

  // Promotions
  async function handleCreatePromo(planId: string) {
    const f = newPromoForms[planId]
    if (!f) return
    setSavingPromo(planId)
    const { error } = await supabase.from('plan_promotions').insert({
      plan_id: planId,
      descricao: f.descricao,
      desconto_pct: parseFloat(f.desconto_pct) || 0,
      inicio: f.inicio,
      fim: f.fim,
      ativo: true,
    })
    setSavingPromo(null)
    if (error) { toast.error(error.message); return }
    toast.success('Promoção criada!')
    setNewPromoForms((prev) => ({ ...prev, [planId]: null }))
    load()
  }

  async function togglePromoAtivo(promoId: string, current: boolean) {
    await supabase.from('plan_promotions').update({ ativo: !current }).eq('id', promoId)
    load()
  }

  if (loadingPlans) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie os planos, features e promoções.</p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />Novo Plano
        </Button>
      </div>

      <div className="space-y-6">
        {plans.map((plan) => {
          const state = editStates[plan.id]
          if (!state) return null
          const promoExpanded = expandedPromos[plan.id] ?? false
          const newPromoForm = newPromoForms[plan.id]

          return (
            <div key={plan.id} className="border border-border/60 rounded-2xl overflow-hidden">
              {/* Plan header */}
              <div className="bg-muted/30 px-6 py-4 flex items-center justify-between border-b border-border/60">
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${state.ativo ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground border-border'}`}>
                    {state.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className="font-bold text-lg">{plan.nome}</span>
                  <span className="text-muted-foreground text-sm">
                    {plan.preco_mensal === 0 ? 'Grátis' : `${formatCurrency(plan.preco_mensal)}/mês`}
                  </span>
                </div>
                <button
                  onClick={() => updateEdit(plan.id, { ativo: !state.ativo })}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  {state.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </div>

              {/* Plan fields */}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nome</Label>
                    <Input value={state.nome} onChange={(e) => updateEdit(plan.id, { nome: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Descrição</Label>
                    <Input value={state.descricao} onChange={(e) => updateEdit(plan.id, { descricao: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preço Mensal (R$)</Label>
                    <Input type="number" step="0.01" min="0" value={state.preco_mensal}
                      onChange={(e) => updateEdit(plan.id, { preco_mensal: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Máx. Obras (-1 = ilimitado)</Label>
                    <Input type="number" min="-1" value={state.max_obras}
                      onChange={(e) => updateEdit(plan.id, { max_obras: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>

                {/* Feature toggles */}
                <div>
                  <p className="text-sm font-semibold mb-3">Funcionalidades</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FEATURE_KEYS.map((key) => (
                      <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.features[key] ?? false}
                          onChange={() => toggleFeature(plan.id, key)}
                          className="w-4 h-4 rounded accent-primary"
                        />
                        <span className="text-sm">{FEATURE_LABELS[key]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSavePlan(plan.id)}
                    disabled={savingPlan === plan.id}
                    size="sm"
                    className="gap-2"
                  >
                    {savingPlan === plan.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Salvar plano
                  </Button>
                </div>

                {/* Promotions */}
                <div className="border-t border-border/60 pt-4">
                  <button
                    className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setExpandedPromos((prev) => ({ ...prev, [plan.id]: !prev[plan.id] }))}
                  >
                    {promoExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Promoções ({plan.plan_promotions?.length ?? 0})
                  </button>

                  {promoExpanded && (
                    <div className="mt-4 space-y-3">
                      {(plan.plan_promotions ?? []).length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhuma promoção cadastrada.</p>
                      )}
                      {(plan.plan_promotions ?? []).map((promo) => (
                        <div key={promo.id} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 text-sm">
                          <div>
                            <p className="font-medium">{promo.descricao}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {promo.desconto_pct}% de desconto · {new Date(promo.inicio).toLocaleDateString('pt-BR')} → {new Date(promo.fim).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <button
                            onClick={() => togglePromoAtivo(promo.id, promo.ativo)}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${promo.ativo ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground border-border'}`}
                          >
                            {promo.ativo ? 'Ativa' : 'Inativa'}
                          </button>
                        </div>
                      ))}

                      {/* New promo form */}
                      {newPromoForm === null ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setNewPromoForms((prev) => ({
                            ...prev,
                            [plan.id]: { descricao: '', desconto_pct: '', inicio: '', fim: '' },
                          }))}
                        >
                          <Plus className="w-3.5 h-3.5" /> Nova promoção
                        </Button>
                      ) : (
                        <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-muted/20">
                          <p className="text-sm font-semibold">Nova promoção</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1 sm:col-span-2">
                              <Label className="text-xs">Descrição *</Label>
                              <Input
                                placeholder="Ex: Black Friday 2026"
                                value={newPromoForm.descricao}
                                onChange={(e) => setNewPromoForms((prev) => ({
                                  ...prev,
                                  [plan.id]: { ...prev[plan.id]!, descricao: e.target.value },
                                }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Desconto (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                placeholder="20"
                                value={newPromoForm.desconto_pct}
                                onChange={(e) => setNewPromoForms((prev) => ({
                                  ...prev,
                                  [plan.id]: { ...prev[plan.id]!, desconto_pct: e.target.value },
                                }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Início</Label>
                              <Input
                                type="datetime-local"
                                value={newPromoForm.inicio}
                                onChange={(e) => setNewPromoForms((prev) => ({
                                  ...prev,
                                  [plan.id]: { ...prev[plan.id]!, inicio: e.target.value },
                                }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Fim</Label>
                              <Input
                                type="datetime-local"
                                value={newPromoForm.fim}
                                onChange={(e) => setNewPromoForms((prev) => ({
                                  ...prev,
                                  [plan.id]: { ...prev[plan.id]!, fim: e.target.value },
                                }))}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNewPromoForms((prev) => ({ ...prev, [plan.id]: null }))}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              disabled={savingPromo === plan.id}
                              onClick={() => handleCreatePromo(plan.id)}
                              className="gap-1.5"
                            >
                              {savingPromo === plan.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Salvar promoção
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dialog: New Plan */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Plano</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preço Mensal (R$)</Label>
                <Input type="number" step="0.01" min="0" value={form.preco_mensal}
                  onChange={(e) => setForm((p) => ({ ...p, preco_mensal: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Máx. Obras (-1 = ∞)</Label>
                <Input type="number" min="-1" value={form.max_obras}
                  onChange={(e) => setForm((p) => ({ ...p, max_obras: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Funcionalidades</p>
              <div className="grid grid-cols-1 gap-2">
                {FEATURE_KEYS.map((key) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.features[key] ?? false}
                      onChange={() => setForm((p) => ({ ...p, features: { ...p.features, [key]: !p.features[key] } }))}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm">{FEATURE_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Criar Plano
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
