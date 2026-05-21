'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Clock, Users, HardHat,
  CheckCircle2, Circle, Loader2, X, CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Evento = {
  id: string
  titulo: string
  descricao: string | null
  data_inicio: string
  data_fim: string | null
  tipo: 'EVENTO' | 'REUNIAO' | 'PRAZO' | 'VISITA'
  origem: 'MANUAL' | 'CRONOGRAMA'
  concluido: boolean
  obra_id: string | null
  responsavel_id: string | null
  criado_por: string
}

type CronItem = {
  id: string
  obra_id: string
  tarefa: string
  data_prevista_inicio: string
  data_prevista_fim: string
  responsavel: string | null
  status: string
}

type Obra = { id: string; nome: string }
type Membro = { id: string; name: string | null }

interface Props {
  eventos: Evento[]
  cronogramas: CronItem[]
  obras: Obra[]
  membros: Membro[]
  userId: string
  orgId: string
  isAdmin: boolean
}

const TIPO_CONFIG = {
  EVENTO: { label: 'Evento', color: 'bg-primary/15 text-primary border-primary/30' },
  REUNIAO: { label: 'Reunião', color: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
  PRAZO: { label: 'Prazo', color: 'bg-red-500/15 text-red-500 border-red-500/30' },
  VISITA: { label: 'Visita', color: 'bg-green-500/15 text-green-500 border-green-500/30' },
  CRONOGRAMA: { label: 'Cronograma', color: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30' },
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function isoDateStr(date: Date) {
  return date.toISOString().split('T')[0]
}

export default function AgendaClient({ eventos, cronogramas, obras, membros, userId, orgId, isAdmin }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const hoje = new Date()
  const [viewDate, setViewDate] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const [selected, setSelected] = useState<string>(isoDateStr(hoje))
  const [filterObra, setFilterObra] = useState<string>('all')
  const [filterMeus, setFilterMeus] = useState(false)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    data_inicio: selected,
    data_fim: '',
    tipo: 'EVENTO' as Evento['tipo'],
    obra_id: '_none_',
    responsavel_id: '_none_',
  })

  const obraMap = useMemo(() => new Map(obras.map((o) => [o.id, o.nome])), [obras])

  // Unir eventos manuais + cronograma como eventos unificados
  const allEvents = useMemo(() => {
    const evs: Array<{
      id: string
      titulo: string
      data: string // YYYY-MM-DD
      tipo: keyof typeof TIPO_CONFIG
      concluido: boolean
      obra_id: string | null
      criado_por: string | null
    }> = [
      ...eventos.map((e) => ({
        id: e.id,
        titulo: e.titulo,
        data: e.data_inicio.substring(0, 10),
        tipo: e.tipo,
        concluido: e.concluido,
        obra_id: e.obra_id,
        criado_por: e.criado_por,
      })),
      ...cronogramas.map((c) => ({
        id: `crono-${c.id}`,
        titulo: c.tarefa,
        data: c.data_prevista_inicio,
        tipo: 'CRONOGRAMA' as keyof typeof TIPO_CONFIG,
        concluido: c.status === 'CONCLUIDA',
        obra_id: c.obra_id,
        criado_por: null,
      })),
    ]

    return evs.filter((e) => {
      if (filterObra && filterObra !== 'all' && e.obra_id !== filterObra) return false
      if (filterMeus && e.criado_por !== userId) return false
      return true
    })
  }, [eventos, cronogramas, filterObra, filterMeus, userId])

  // Agrupar por data
  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof allEvents>()
    for (const e of allEvents) {
      const list = map.get(e.data) ?? []
      list.push(e)
      map.set(e.data, list)
    }
    return map
  }, [allEvents])

  // Dias do mês exibido
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calDays: Array<string | null> = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1)
      return isoDateStr(d)
    }),
  ]

  const selectedDayEvents = eventsByDate.get(selected) ?? []

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)) }

  function openCreate() {
    setForm((p) => ({ ...p, titulo: '', descricao: '', data_inicio: selected, data_fim: '', tipo: 'EVENTO', obra_id: '_none_', responsavel_id: '_none_' }))
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim()) { toast.error('Título é obrigatório'); return }
    if (!orgId) { toast.error('Organização não encontrada. Recarregue a página.'); return }
    setSaving(true)
    const { error } = await supabase.from('agenda_eventos').insert({
      organization_id: orgId,
      criado_por: userId,
      titulo: form.titulo.trim(),
      descricao: form.descricao || null,
      data_inicio: new Date(form.data_inicio + 'T12:00:00').toISOString(),
      data_fim: form.data_fim ? new Date(form.data_fim + 'T12:00:00').toISOString() : null,
      tipo: form.tipo,
      obra_id: form.obra_id === '_none_' ? null : form.obra_id,
      responsavel_id: form.responsavel_id === '_none_' ? null : form.responsavel_id,
    })
    setSaving(false)
    if (error) { toast.error(`Erro: ${error.message}`); return }
    toast.success('Evento criado!')
    setOpen(false)
    router.refresh()
  }

  async function toggleConcluido(id: string, concluido: boolean) {
    await supabase.from('agenda_eventos').update({ concluido: !concluido }).eq('id', id)
    router.refresh()
  }

  async function deleteEvento(id: string) {
    await supabase.from('agenda_eventos').delete().eq('id', id)
    toast.success('Evento removido')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Eventos, prazos e tarefas do cronograma.</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />Novo evento
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterObra} onValueChange={setFilterObra}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue placeholder="Todas as obras" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as obras</SelectItem>
            {obras.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant={filterMeus ? 'default' : 'outline'}
          onClick={() => setFilterMeus((p) => !p)}
          className="gap-2 h-8"
        >
          <Users className="w-3.5 h-3.5" />
          Meus eventos
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendário */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            {/* Navegação do mês */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="font-semibold text-sm">{MESES[month]} {year}</h2>
              <button onClick={nextMonth} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 mb-2">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7 gap-1">
              {calDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />
                const isToday = day === isoDateStr(hoje)
                const isSelected = day === selected
                const dayEvents = eventsByDate.get(day) ?? []

                return (
                  <button
                    key={day}
                    onClick={() => setSelected(day)}
                    className={cn(
                      'relative flex flex-col items-center p-1.5 rounded-lg text-sm transition-all min-h-[44px]',
                      isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted',
                    )}
                  >
                    <span className="text-xs font-medium leading-tight">{new Date(day + 'T12:00').getDate()}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 flex-wrap justify-center mt-0.5">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              isSelected ? 'bg-white/70' : 'bg-primary',
                            )}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className={cn('text-[9px]', isSelected ? 'text-white/70' : 'text-muted-foreground')}>
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Painel lateral — eventos do dia */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              {new Date(selected + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <span className="text-xs text-muted-foreground">{selectedDayEvents.length} evento{selectedDayEvents.length !== 1 ? 's' : ''}</span>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2 border border-dashed border-border rounded-xl">
              <Calendar className="w-8 h-8 opacity-30" />
              <p className="text-sm">Nenhum evento neste dia</p>
              <Button size="sm" variant="outline" onClick={openCreate} className="gap-1.5 mt-1">
                <Plus className="w-3.5 h-3.5" />Adicionar
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((ev) => {
                const cfg = TIPO_CONFIG[ev.tipo]
                const isManual = !ev.id.startsWith('crono-')
                return (
                  <Card key={ev.id} className={cn('border-border/60', ev.concluido && 'opacity-60')}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => isManual && toggleConcluido(ev.id, ev.concluido)}
                          className={isManual ? 'mt-0.5 shrink-0' : 'mt-0.5 shrink-0 cursor-default'}
                        >
                          {ev.concluido
                            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                            : <Circle className="w-4 h-4 text-muted-foreground/40" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium leading-snug', ev.concluido && 'line-through text-muted-foreground')}>
                            {ev.titulo}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', cfg.color)}>
                              {cfg.label}
                            </Badge>
                            {ev.obra_id && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <HardHat className="w-3 h-3" />
                                {obraMap.get(ev.obra_id) ?? '—'}
                              </span>
                            )}
                          </div>
                        </div>
                        {isManual && ev.criado_por === userId && (
                          <button
                            onClick={() => deleteEvento(ev.id)}
                            className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog novo evento */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Evento</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data início *</Label>
                <Input
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => setForm((p) => ({ ...p, data_inicio: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data fim</Label>
                <Input
                  type="date"
                  value={form.data_fim}
                  onChange={(e) => setForm((p) => ({ ...p, data_fim: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((p) => ({ ...p, tipo: v as Evento['tipo'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVENTO">Evento</SelectItem>
                    <SelectItem value="REUNIAO">Reunião</SelectItem>
                    <SelectItem value="PRAZO">Prazo</SelectItem>
                    <SelectItem value="VISITA">Visita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Obra (opcional)</Label>
                <Select value={form.obra_id} onValueChange={(v) => setForm((p) => ({ ...p, obra_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_">Nenhuma</SelectItem>
                    {obras.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Responsável (opcional)</Label>
              <Select value={form.responsavel_id} onValueChange={(v) => setForm((p) => ({ ...p, responsavel_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sem responsável" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Sem responsável</SelectItem>
                  {membros.map((m) => <SelectItem key={m.id} value={m.id}>{m.name ?? m.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Criar evento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
