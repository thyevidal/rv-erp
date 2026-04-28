'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import type { Cronograma, CronoStatus } from '@/types'
import { Plus, Loader2, CheckCircle2, Clock, Activity, AlertTriangle, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_CFG: Record<CronoStatus, { label: string; classes: string; icon: React.ElementType }> = {
  PENDENTE: { label: 'Pendente', classes: 'bg-muted text-muted-foreground border-border', icon: Clock },
  EM_ANDAMENTO: { label: 'Em Andamento', classes: 'bg-primary/10 text-primary border-primary/30', icon: Activity },
  CONCLUIDA: { label: 'Concluída', classes: 'bg-green-500/10 text-green-400 border-green-500/30', icon: CheckCircle2 },
  ATRASADA: { label: 'Atrasada', classes: 'bg-red-500/10 text-red-400 border-red-500/30', icon: AlertTriangle },
}

// Responsáveis já usados nas tarefas — para sugestão
function useResponsaveis(tarefas: Cronograma[]) {
  return useMemo(() => {
    const set = new Set(tarefas.map((t) => t.responsavel).filter(Boolean) as string[])
    return Array.from(set)
  }, [tarefas])
}

// Calcula status automático baseado em datas e progresso
function calcStatus(
  pct: number,
  dataFim: string | null | undefined,
  statusAtual: CronoStatus
): CronoStatus {
  if (pct === 100) return 'CONCLUIDA'
  if (dataFim) {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim + 'T00:00:00')
    if (fim < hoje && pct < 100) return 'ATRASADA'
  }
  if (pct > 0 && pct < 100) return 'EM_ANDAMENTO'
  // pct === 0: sempre Pendente independente do que estava salvo
  return 'PENDENTE'
}

interface Props { obraId: string; tarefas: Cronograma[] }

const EMPTY = {
  tarefa: '',
  descricao: '',
  data_prevista_inicio: '',
  data_prevista_fim: '',
  percentual_conclusao: '0',
  responsavel: '',
}

export default function CronogramaTab({ obraId, tarefas }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Cronograma | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const responsaveis = useResponsaveis(tarefas)

  // Aplica status automático nas tarefas para exibição
  const tarefasComStatus = tarefas.map((t) => ({
    ...t,
    status: calcStatus(t.percentual_conclusao, t.data_prevista_fim, t.status),
  }))

  const total = tarefasComStatus.length
  const concluidas = tarefasComStatus.filter((t) => t.status === 'CONCLUIDA').length
  const atrasadas = tarefasComStatus.filter((t) => t.status === 'ATRASADA').length
  const idp = total > 0 ? (concluidas / total) * 100 : 0

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY })
    setDialogOpen(true)
  }

  function openEdit(t: Cronograma) {
    setEditing(t)
    setForm({
      tarefa: t.tarefa,
      descricao: t.descricao ?? '',
      data_prevista_inicio: t.data_prevista_inicio ?? '',
      data_prevista_fim: t.data_prevista_fim ?? '',
      percentual_conclusao: String(t.percentual_conclusao),
      responsavel: t.responsavel ?? '',
    })
    setDialogOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.tarefa) { toast.error('Informe o nome da tarefa'); return }
    setLoading(true)

    const pct = parseInt(form.percentual_conclusao) || 0
    const status = calcStatus(pct, form.data_prevista_fim || null, editing?.status ?? 'PENDENTE')

    const payload = {
      obra_id: obraId,
      tarefa: form.tarefa,
      descricao: form.descricao || null,
      data_prevista_inicio: form.data_prevista_inicio || null,
      data_prevista_fim: form.data_prevista_fim || null,
      percentual_conclusao: pct,
      responsavel: form.responsavel || null,
      status,
    }

    const { error } = editing
      ? await supabase.from('cronograma').update(payload).eq('id', editing.id)
      : await supabase.from('cronograma').insert(payload)

    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success(editing ? 'Tarefa atualizada!' : 'Tarefa adicionada!')
    setDialogOpen(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta tarefa?')) return
    const { error } = await supabase.from('cronograma').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Tarefa removida')
    router.refresh()
  }

  async function handlePctChange(t: Cronograma, pct: number) {
    const status = calcStatus(pct, t.data_prevista_fim, t.status)
    await supabase.from('cronograma').update({ percentual_conclusao: pct, status }).eq('id', t.id)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="text-muted-foreground">{total} {total === 1 ? 'tarefa' : 'tarefas'}</span>
          <span className="text-green-400">{concluidas} concluídas</span>
          {atrasadas > 0 && <span className="text-red-400">{atrasadas} atrasadas</span>}
        </div>
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="w-3.5 h-3.5" /> Nova Tarefa
        </Button>
      </div>

      {/* IDP */}
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

      {/* Tabela */}
      {tarefasComStatus.length === 0 ? (
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
                  <th className="text-left px-2 py-2.5 font-medium w-44">Progresso</th>
                  <th className="text-center px-2 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {tarefasComStatus.map((t) => {
                  const cfg = STATUS_CFG[t.status]
                  const Icon = cfg.icon
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{t.tarefa}</div>
                        {t.descricao && <div className="text-xs text-muted-foreground mt-0.5">{t.descricao}</div>}
                      </td>
                      <td className="px-2 py-3 text-muted-foreground text-xs">
                        {t.responsavel || <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="text-center px-2 py-3 text-xs">
                        {t.data_prevista_inicio ? formatDate(t.data_prevista_inicio) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="text-center px-2 py-3 text-xs">
                        {t.data_prevista_fim ? formatDate(t.data_prevista_fim) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={t.percentual_conclusao} className="h-1.5 flex-1" />
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={t.percentual_conclusao}
                            onChange={(e) => handlePctChange(t, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                            onBlur={(e) => handlePctChange(t, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="w-12 text-xs text-right bg-transparent border-b border-border/40 focus:border-primary outline-none text-muted-foreground"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </td>
                      <td className="text-center px-2 py-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.classes}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            size="icon" variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => openEdit(t)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(t.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dialog add/edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 pt-1">

            <div className="space-y-1.5">
              <Label>Nome da Tarefa *</Label>
              <Input
                value={form.tarefa}
                onChange={(e) => set('tarefa', e.target.value)}
                placeholder="Ex.: Concretagem das fundações"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                value={form.descricao}
                onChange={(e) => set('descricao', e.target.value)}
                placeholder="Opcional..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Input
                value={form.responsavel}
                onChange={(e) => set('responsavel', e.target.value)}
                placeholder="Nome do responsável"
                list="responsaveis-list"
              />
              <datalist id="responsaveis-list">
                {responsaveis.map((r) => <option key={r} value={r} />)}
              </datalist>
              <p className="text-xs text-muted-foreground">Opcional — pode definir depois</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={form.data_prevista_inicio}
                  onChange={(e) => set('data_prevista_inicio', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data Término</Label>
                <Input
                  type="date"
                  value={form.data_prevista_fim}
                  onChange={(e) => set('data_prevista_fim', e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">Datas opcionais — pode definir depois</p>

            <div className="space-y-1.5">
              <Label>Progresso (%)</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.percentual_conclusao}
                  onChange={(e) => set('percentual_conclusao', e.target.value)}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-semibold w-10 text-right">{form.percentual_conclusao}%</span>
              </div>
              <Progress value={parseInt(form.percentual_conclusao)} className="h-1.5" />
            </div>

            {/* Preview do status automático */}
            {(() => {
              const pct = parseInt(form.percentual_conclusao) || 0
              const status = calcStatus(pct, form.data_prevista_fim || null, editing?.status ?? 'PENDENTE')
              const cfg = STATUS_CFG[status]
              const Icon = cfg.icon
              return (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Status calculado:</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${cfg.classes}`}>
                    <Icon className="w-3 h-3" />{cfg.label}
                  </span>
                </div>
              )
            })()}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? 'Salvar Alterações' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}