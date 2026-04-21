'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Obra, ObraStatus } from '@/types'

interface Props {
  obra: Obra
  trigger?: React.ReactNode
}

const STATUS_OPTIONS: { value: ObraStatus; label: string }[] = [
  { value: 'PLANEJAMENTO', label: 'Planejamento' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'PAUSADA',      label: 'Pausada' },
  { value: 'CONCLUIDA',   label: 'Concluída' },
  { value: 'CANCELADA',   label: 'Cancelada' },
]

export default function EditObraDialog({ obra, trigger }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome:        obra.nome,
    endereco:    obra.endereco    ?? '',
    status:      obra.status,
    data_inicio: obra.data_inicio ?? '',
    data_fim:    obra.data_fim    ?? '',
    descricao:   obra.descricao   ?? '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { toast.error('O nome da obra é obrigatório.'); return }
    setLoading(true)
    const { error } = await supabase
      .from('obras')
      .update({
        nome:        form.nome,
        endereco:    form.endereco    || null,
        status:      form.status,
        data_inicio: form.data_inicio || null,
        data_fim:    form.data_fim    || null,
        descricao:   form.descricao   || null,
      })
      .eq('id', obra.id)
    setLoading(false)

    if (error) { toast.error('Erro ao salvar: ' + error.message); return }
    toast.success('Obra atualizada com sucesso!')
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="w-3.5 h-3.5" />
            Editar Obra
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Obra</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-nome">Nome da Obra *</Label>
            <Input
              id="edit-nome"
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
              placeholder="Ex.: Residencial Pinheiros — Bloco A"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-endereco">Endereço</Label>
            <Input
              id="edit-endereco"
              value={form.endereco}
              onChange={(e) => set('endereco', e.target.value)}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-inicio">Data de Início</Label>
              <Input
                id="edit-inicio"
                type="date"
                value={form.data_inicio}
                onChange={(e) => set('data_inicio', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-fim">Data de Término</Label>
              <Input
                id="edit-fim"
                type="date"
                value={form.data_fim}
                onChange={(e) => set('data_fim', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-descricao">Descrição</Label>
            <Textarea
              id="edit-descricao"
              value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              placeholder="Informações gerais sobre a obra..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
