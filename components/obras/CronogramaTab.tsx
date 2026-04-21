'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import type { Cronograma, CronoStatus } from '@/types'
import { Plus, Loader2, CheckCircle2, Clock, Activity, AlertTriangle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_CFG: Record<CronoStatus, { label: string; classes: string; icon: React.ElementType }> = {
  PENDENTE:     { label: 'Pendente',     classes: 'bg-muted text-muted-foreground border-border', icon: Clock },
  EM_ANDAMENTO: { label: 'Em Andamento', classes: 'bg-primary/10 text-primary border-primary/30', icon: Activity },
  CONCLUIDA:    { label: 'Concluída',    classes: 'bg-green-500/10 text-green-400 border-green-500/30', icon: CheckCircle2 },
  ATRASADA:     { label: 'Atrasada',     classes: 'bg-red-500/10 text-red-400 border-red-500/30', icon: AlertTriangle },
}

interface Props { obraId: string; tarefas: Cronograma[] }

const EMPTY = {
  tarefa: '', descricao: '', data_prevista_inicio: '', data_prevista_fim: '',
  percentual_conclusao: '0', status: 'PENDENTE' as CronoStatus, responsavel: ''
}

export default function CronogramaTab({ obraId, tarefas }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [addOpen, setAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })

  const total = tarefas.length
  const concluidas = tarefas.filter((t) => t.status === 'CONCLUIDA').length
  const idp = total > 0 ? (concluidas / total) * 100 : 0
  const atrasadas = tarefas.filter((t) => t.status === 'ATRASADA').length

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.tarefa || !form.data_prevista_inicio || !form.data_prevista_fim) {
      toast.error('Preencha tarefa e datas'); return
    }
    setLoading(true)
    const { error } = await supabase.from('cronograma').insert({
      obra_id: obraId,
      tarefa: form.tarefa,
      descricao: form.descricao || null,
      data_prevista_inicio: form.data_prevista_inicio,
      data_prevista_fim: form.data_prevista_fim,
      status: form.status,
      percentual_conclusao: parseInt(form.percentual_conclusao) || 0,
      responsavel: form.responsavel || null,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Tarefa adicionada!')
    setAddOpen(false)
    setForm({ ...EMPTY })
    router.refresh()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('cronograma').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Tarefa removida')
    router.refresh()
  }

  async function handleStatusChange(id: string, status: CronoStatus) {
    const { error } = await supabase.from('cronograma').update({ status }).eq('id', id)
    if (error) { toast.error(error.message); return }
    router.refresh()
  }

  async function handlePctChange(id: string, percentual_conclusao: number) {
    const status: CronoStatus = percentual_conclusao === 100 ? 'CONCLUIDA' : percentual_conclusao > 0 ? 'EM_ANDAMENTO' : 'PENDENTE'
    await supabase.from('cronograma').update({ percentual_conclusao, status }).eq('id', id)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-muted-foreground">{total} tarefas</span>
          <span className="text-green-400">{concluidas} concluídas</span>
          {atrasadas > 0 && <span className="text-red-400">{atrasadas} atrasadas</span>}
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> Nova Tarefa
        </Button>
      </div>

      {/* IDP Progress */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">IDP — Índice de Desempenho de Prazo</span>
            <span className="font-bold text-primary">{idp.toFixed(0)}%</span>
          </div>
          <Progress value={idp} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-2">
            {concluidas} de {total} tarefas concluídas
          </p>
        </CardContent>
      </Card>

      {/* Gantt simples */}
      {tarefas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Nenhuma tarefa cadastrada ainda.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-muted-foreground text-xs border-b">
                  <th className="text-left px-4 py-2.5 font-medium">Tarefa</th>
                  <th className="text-left px-2 py-2.5 font-medium">Responsável</th>
                  <th className="text-center px-2 py-2.5 font-medium">Início</th>
                  <th className="text-center px-2 py-2.5 font-medium">Término</th>
                  <th className="text-left px-2 py-2.5 font-medium w-36">Progresso</th>
                  <th className="text-center px-2 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {tarefas.map((t) => {
                  const cfg = STATUS_CFG[t.status]
                  const Icon = cfg.icon
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="font-medium">{t.tarefa}</div>
                        {t.descricao && <div className="text-xs text-muted-foreground mt-0.5">{t.descricao}</div>}
                      </td>
                      <td className="px-2 py-3 text-muted-foreground text-xs">{t.responsavel || '—'}</td>
                      <td className="text-center px-2 py-3 text-xs">{formatDate(t.data_prevista_inicio)}</td>
                      <td className="text-center px-2 py-3 text-xs">{formatDate(t.data_prevista_fim)}</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={t.percentual_conclusao} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{t.percentual_conclusao}%</span>
                        </div>
                      </td>
                      <td className="text-center px-2 py-3">
                        <Select value={t.status} onValueChange={(v) => handleStatusChange(t.id, v as CronoStatus)}>
                          <SelectTrigger className={`h-7 text-[11px] px-2 border rounded-full w-32 mx-auto ${cfg.classes}`}>
                            <div className="flex items-center gap-1">
                              <Icon className="w-3 h-3" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CFG).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-3">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(t.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Tarefa *</Label>
              <Input value={form.tarefa} onChange={(e) => set('tarefa', e.target.value)} placeholder="Ex.: Concretagem das fundações" required />
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={(e) => set('responsavel', e.target.value)} placeholder="Nome do responsável" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Início *</Label>
                <Input type="date" value={form.data_prevista_inicio} onChange={(e) => set('data_prevista_inicio', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Término *</Label>
                <Input type="date" value={form.data_prevista_fim} onChange={(e) => set('data_prevista_fim', e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>% Conclusão</Label>
                <Input type="number" min="0" max="100" value={form.percentual_conclusao} onChange={(e) => set('percentual_conclusao', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-2">
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
