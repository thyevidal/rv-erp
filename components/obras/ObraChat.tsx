'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Loader2, Sparkles, Trash2, Check, AlertCircle, CalendarDays, Receipt, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import type { PendingChanges, PendingCronogramaItem, PendingOrcamentoItem, PendingDeleteItem, PendingUpdateOrcamentoItem, PendingUpdateCronogramaItem } from '@/lib/ai-types'

interface Message {
  role: 'user' | 'model'
  text: string
  pendingChanges?: PendingChanges
  applied?: boolean
}

const SUGESTOES = [
  'Como está o andamento geral desta obra?',
  'Gera um cronograma completo para esta obra',
  'Há algum item faltando no orçamento?',
  'Quais tarefas posso adiantar se a equipe ficar ociosa?',
]

const STORAGE_KEY = (obraId: string) => `obra-chat-${obraId}`

const sanitize = (text: string) =>
  text.replace(/<(script|style|iframe|object|embed|link|meta)[\s\S]*?<\/\1>/gi, '')
      .replace(/<(script|style|iframe|object|embed|link|meta)[^>]*\/>/gi, '')

const fmtDate = (d: string | null) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'

const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// ─── Card de confirmação do cronograma ────────────────────────────────────────

function CronogramaCard({
  changes,
  obraId,
  onApplied,
}: {
  changes: Extract<PendingChanges, { type: 'cronograma' }>
  obraId: string
  onApplied: () => void
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function apply() {
    setState('loading')
    try {
      const res = await fetch(`/api/obras/${obraId}/apply-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingChanges: changes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`)
      setState('done')
      onApplied()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao aplicar.')
      setState('error')
    }
  }

  const label = changes.action === 'replace' ? 'Substituir cronograma' : 'Adicionar ao cronograma'

  return (
    <div className="mt-2 rounded-xl border bg-card overflow-hidden text-xs">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-primary/5 border-b">
        <CalendarDays className="w-3.5 h-3.5 text-primary" />
        <span className="font-semibold text-foreground">
          Cronograma proposto — {changes.items.length} tarefa{changes.items.length !== 1 ? 's' : ''}
        </span>
        {changes.action === 'replace' && (
          <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">substitui atual</span>
        )}
      </div>

      <div className="max-h-48 overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Tarefa</th>
              <th className="text-center px-2 py-1.5 font-medium text-muted-foreground whitespace-nowrap">Início</th>
              <th className="text-center px-2 py-1.5 font-medium text-muted-foreground whitespace-nowrap">Fim</th>
            </tr>
          </thead>
          <tbody>
            {(changes.items as PendingCronogramaItem[]).map((t, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-3 py-1.5 text-foreground">{t.tarefa}</td>
                <td className="px-2 py-1.5 text-center text-muted-foreground">{fmtDate(t.data_prevista_inicio)}</td>
                <td className="px-2 py-1.5 text-center text-muted-foreground">{fmtDate(t.data_prevista_fim)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 flex items-center gap-2 border-t bg-muted/20">
        {state === 'done' ? (
          <span className="flex items-center gap-1.5 text-green-600 font-medium">
            <Check className="w-3.5 h-3.5" /> Aplicado com sucesso
          </span>
        ) : state === 'error' ? (
          <span className="flex items-center gap-1.5 text-destructive font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
          </span>
        ) : (
          <>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={apply}
              disabled={state === 'loading'}
            >
              {state === 'loading' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              {label}
            </Button>
            <span className="text-muted-foreground text-[10px]">Revise antes de aplicar</span>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Card de confirmação do orçamento ─────────────────────────────────────────

function OrcamentoCard({
  changes,
  obraId,
  onApplied,
}: {
  changes: Extract<PendingChanges, { type: 'orcamento' }>
  obraId: string
  onApplied: () => void
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function apply() {
    setState('loading')
    try {
      const res = await fetch(`/api/obras/${obraId}/apply-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingChanges: changes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`)
      setState('done')
      onApplied()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao aplicar.')
      setState('error')
    }
  }

  const itens = changes.items as PendingOrcamentoItem[]
  const total = itens.reduce((s, i) => s + i.quantidade * i.custo_unitario_aplicado, 0)

  return (
    <div className="mt-2 rounded-xl border bg-card overflow-hidden text-xs">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-primary/5 border-b">
        <Receipt className="w-3.5 h-3.5 text-primary" />
        <span className="font-semibold text-foreground">
          Itens propostos — {itens.length} item{itens.length !== 1 ? 'ns' : ''}
        </span>
      </div>

      <div className="max-h-48 overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Descrição</th>
              <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Qtd</th>
              <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Un</th>
              <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Total</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i, idx) => (
              <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-3 py-1.5 text-foreground">
                  <div>{i.descricao}</div>
                  <div className="text-[10px] text-muted-foreground">{i.etapa}{i.subetapa ? ` › ${i.subetapa}` : ''}</div>
                </td>
                <td className="px-2 py-1.5 text-right text-muted-foreground">{i.quantidade}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{i.unidade}</td>
                <td className="px-3 py-1.5 text-right text-foreground font-medium">
                  {fmtBRL(i.quantidade * i.custo_unitario_aplicado)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 flex items-center gap-2 border-t bg-muted/20">
        {state === 'done' ? (
          <span className="flex items-center gap-1.5 text-green-600 font-medium">
            <Check className="w-3.5 h-3.5" /> Aplicado com sucesso
          </span>
        ) : state === 'error' ? (
          <span className="flex items-center gap-1.5 text-destructive font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
          </span>
        ) : (
          <>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={apply}
              disabled={state === 'loading'}
            >
              {state === 'loading' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Adicionar ao orçamento
            </Button>
            <span className="ml-auto font-semibold text-foreground">{fmtBRL(total)}</span>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Card de exclusão de itens do orçamento ───────────────────────────────────

function DeleteOrcamentoCard({
  changes,
  obraId,
  onApplied,
}: {
  changes: Extract<PendingChanges, { type: 'delete_orcamento' }>
  obraId: string
  onApplied: () => void
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function apply() {
    setState('loading')
    try {
      const res = await fetch(`/api/obras/${obraId}/apply-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingChanges: changes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`)
      setState('done')
      onApplied()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao aplicar.')
      setState('error')
    }
  }

  const itens = changes.items as PendingDeleteItem[]

  return (
    <div className="mt-2 rounded-xl border border-destructive/30 bg-card overflow-hidden text-xs">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-destructive/5 border-b border-destructive/20">
        <Trash2 className="w-3.5 h-3.5 text-destructive" />
        <span className="font-semibold text-foreground">
          Excluir {itens.length} item{itens.length !== 1 ? 'ns' : ''} do orçamento
        </span>
      </div>

      <div className="max-h-36 overflow-y-auto">
        {itens.map((i, idx) => (
          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 border-b last:border-0 hover:bg-muted/20">
            <span className="flex-1 text-foreground">{i.descricao}</span>
            {i.etapa && <span className="text-muted-foreground">{i.etapa}</span>}
            {i.custo_total !== undefined && (
              <span className="text-destructive font-medium">−{fmtBRL(i.custo_total)}</span>
            )}
          </div>
        ))}
      </div>

      <div className="px-3 py-2 flex items-center gap-2 border-t bg-muted/20">
        {state === 'done' ? (
          <span className="flex items-center gap-1.5 text-green-600 font-medium">
            <Check className="w-3.5 h-3.5" /> Excluído com sucesso
          </span>
        ) : state === 'error' ? (
          <span className="flex items-center gap-1.5 text-destructive font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
          </span>
        ) : (
          <>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs"
              onClick={apply}
              disabled={state === 'loading'}
            >
              {state === 'loading' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Confirmar exclusão
            </Button>
            <span className="text-muted-foreground text-[10px]">Ação irreversível</span>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Card de edição de itens do orçamento ─────────────────────────────────────

function UpdateOrcamentoCard({
  changes,
  obraId,
  onApplied,
}: {
  changes: Extract<PendingChanges, { type: 'update_orcamento' }>
  obraId: string
  onApplied: () => void
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function apply() {
    setState('loading')
    try {
      const res = await fetch(`/api/obras/${obraId}/apply-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingChanges: changes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`)
      setState('done')
      onApplied()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao aplicar.')
      setState('error')
    }
  }

  const itens = changes.items as PendingUpdateOrcamentoItem[]

  return (
    <div className="mt-2 rounded-xl border bg-card overflow-hidden text-xs">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-primary/5 border-b">
        <Pencil className="w-3.5 h-3.5 text-primary" />
        <span className="font-semibold text-foreground">
          Editar {itens.length} item{itens.length !== 1 ? 'ns' : ''} do orçamento
        </span>
      </div>

      <div className="max-h-48 overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Descrição</th>
              <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Qtd</th>
              <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Unitário</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i, idx) => (
              <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-3 py-1.5 text-foreground">{i.descricao ?? '—'}</td>
                <td className="px-2 py-1.5 text-right text-muted-foreground">{i.quantidade ?? '—'}</td>
                <td className="px-3 py-1.5 text-right text-foreground font-medium">
                  {i.custo_unitario_aplicado !== undefined ? fmtBRL(i.custo_unitario_aplicado) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 flex items-center gap-2 border-t bg-muted/20">
        {state === 'done' ? (
          <span className="flex items-center gap-1.5 text-green-600 font-medium">
            <Check className="w-3.5 h-3.5" /> Atualizado com sucesso
          </span>
        ) : state === 'error' ? (
          <span className="flex items-center gap-1.5 text-destructive font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
          </span>
        ) : (
          <Button size="sm" className="h-7 text-xs" onClick={apply} disabled={state === 'loading'}>
            {state === 'loading' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Aplicar edições
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Card de edição de tarefas do cronograma ──────────────────────────────────

function UpdateCronogramaCard({
  changes,
  obraId,
  onApplied,
}: {
  changes: Extract<PendingChanges, { type: 'update_cronograma' }>
  obraId: string
  onApplied: () => void
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function apply() {
    setState('loading')
    try {
      const res = await fetch(`/api/obras/${obraId}/apply-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingChanges: changes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`)
      setState('done')
      onApplied()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao aplicar.')
      setState('error')
    }
  }

  const itens = changes.items as PendingUpdateCronogramaItem[]

  return (
    <div className="mt-2 rounded-xl border bg-card overflow-hidden text-xs">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-primary/5 border-b">
        <Pencil className="w-3.5 h-3.5 text-primary" />
        <span className="font-semibold text-foreground">
          Editar {itens.length} tarefa{itens.length !== 1 ? 's' : ''} do cronograma
        </span>
      </div>

      <div className="max-h-40 overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Tarefa</th>
              <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">Início</th>
              <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">Fim</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((t, idx) => (
              <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-3 py-1.5 text-foreground">{t.tarefa ?? '—'}</td>
                <td className="px-2 py-1.5 text-center text-muted-foreground">{fmtDate(t.data_prevista_inicio ?? null)}</td>
                <td className="px-2 py-1.5 text-center text-muted-foreground">{fmtDate(t.data_prevista_fim ?? null)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 flex items-center gap-2 border-t bg-muted/20">
        {state === 'done' ? (
          <span className="flex items-center gap-1.5 text-green-600 font-medium">
            <Check className="w-3.5 h-3.5" /> Atualizado com sucesso
          </span>
        ) : state === 'error' ? (
          <span className="flex items-center gap-1.5 text-destructive font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
          </span>
        ) : (
          <Button size="sm" className="h-7 text-xs" onClick={apply} disabled={state === 'loading'}>
            {state === 'loading' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Aplicar edições
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ObraChat({ obraId }: { obraId: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(STORAGE_KEY(obraId))
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY(obraId), JSON.stringify(messages))
    } catch { /* storage cheio */ }
  }, [messages, obraId])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [open, messages])

  function markApplied(index: number) {
    setMessages(prev => prev.map((m, i) => i === index ? { ...m, applied: true } : m))
  }

  async function send(text: string) {
    const userMsg: Message = { role: 'user', text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      // Envia apenas os campos que a API espera (sem pendingChanges/applied)
      const payload = next.map(m => ({ role: m.role, text: m.text }))
      const res = await fetch(`/api/obras/${obraId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`)
      if (data.reply || data.pendingChanges) {
        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            text: data.reply || 'Proposta gerada. Confira abaixo e clique em aplicar quando estiver de acordo.',
            pendingChanges: data.pendingChanges ?? undefined,
          },
        ])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao conectar com a IA.'
      setMessages(prev => [...prev, { role: 'model', text: `⚠️ ${msg} Tente novamente.` }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !loading) send(input.trim())
    }
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-200',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          open && 'opacity-0 pointer-events-none'
        )}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Assistente IA</span>
      </button>

      {/* Painel do chat */}
      <div className={cn(
        'fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl border bg-background overflow-hidden transition-all duration-300',
        'w-[400px]',
        open
          ? 'opacity-100 translate-y-0 h-[600px]'
          : 'opacity-0 translate-y-4 h-0 pointer-events-none'
      )}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span className="font-semibold text-sm">Assistente da Obra</span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="opacity-70 hover:opacity-100 transition-opacity p-1 rounded"
                title="Limpar conversa"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100 transition-opacity p-1 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center pt-2">
                Olá! Sou seu assistente especialista em obras.<br />
                Como posso ajudar?
              </p>
              <div className="space-y-2">
                {SUGESTOES.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg border hover:bg-muted transition-colors text-muted-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn('flex flex-col', m.role === 'user' ? 'items-end' : 'items-start')}>
              <div className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start', 'w-full')}>
                {m.role === 'model' && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm whitespace-pre-wrap'
                    : 'bg-muted text-foreground rounded-bl-sm chat-md'
                )}>
                  {m.role === 'user' ? m.text : (
                    <ReactMarkdown>{sanitize(m.text)}</ReactMarkdown>
                  )}
                </div>
              </div>

              {/* Card de confirmação (só para mensagens do modelo com pendingChanges) */}
              {m.role === 'model' && m.pendingChanges && !m.applied && (
                <div className="w-full pl-8 pr-0">
                  {m.pendingChanges.type === 'cronograma' && (
                    <CronogramaCard changes={m.pendingChanges as Extract<PendingChanges, { type: 'cronograma' }>} obraId={obraId} onApplied={() => markApplied(i)} />
                  )}
                  {m.pendingChanges.type === 'orcamento' && (
                    <OrcamentoCard changes={m.pendingChanges as Extract<PendingChanges, { type: 'orcamento' }>} obraId={obraId} onApplied={() => markApplied(i)} />
                  )}
                  {m.pendingChanges.type === 'delete_orcamento' && (
                    <DeleteOrcamentoCard changes={m.pendingChanges as Extract<PendingChanges, { type: 'delete_orcamento' }>} obraId={obraId} onApplied={() => markApplied(i)} />
                  )}
                  {m.pendingChanges.type === 'update_orcamento' && (
                    <UpdateOrcamentoCard changes={m.pendingChanges as Extract<PendingChanges, { type: 'update_orcamento' }>} obraId={obraId} onApplied={() => markApplied(i)} />
                  )}
                  {m.pendingChanges.type === 'update_cronograma' && (
                    <UpdateCronogramaCard changes={m.pendingChanges as Extract<PendingChanges, { type: 'update_cronograma' }>} obraId={obraId} onApplied={() => markApplied(i)} />
                  )}
                </div>
              )}

              {/* Badge "aplicado" persistente */}
              {m.role === 'model' && m.pendingChanges && m.applied && (
                <div className="pl-8 mt-1">
                  <span className="flex items-center gap-1 text-[10px] text-green-600">
                    <Check className="w-3 h-3" /> Aplicado
                  </span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre a obra..."
              rows={1}
              disabled={loading}
              className={cn(
                'flex-1 resize-none rounded-xl border bg-muted/50 px-3 py-2 text-sm',
                'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary',
                'max-h-28 overflow-y-auto leading-relaxed disabled:opacity-50'
              )}
              style={{ height: 'auto' }}
              onInput={e => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 112) + 'px'
              }}
            />
            <Button
              size="icon"
              onClick={() => input.trim() && !loading && send(input.trim())}
              disabled={!input.trim() || loading}
              className="rounded-xl shrink-0 h-9 w-9"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </>
  )
}
