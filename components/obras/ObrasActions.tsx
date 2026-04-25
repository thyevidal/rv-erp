'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  primary?: boolean
}

export default function ObrasActions({ primary }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '', endereco: '', status: 'PLANEJAMENTO', data_inicio: '', data_fim: '', descricao: ''
  })

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { toast.error('Informe o nome da obra'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) {
      toast.error('Perfil de organização não encontrado')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('obras').insert({
      ...form,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
      user_id: user.id,
      organization_id: profile.organization_id,
    })
    setLoading(false)
    if (error) { toast.error('Erro ao criar obra: ' + error.message); return }
    toast.success('Obra criada com sucesso!')
    setOpen(false)
    setForm({ nome: '', endereco: '', status: 'PLANEJAMENTO', data_inicio: '', data_fim: '', descricao: '' })
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Nova Obra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Obra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome da Obra *</Label>
            <Input id="nome" value={form.nome} onChange={(e) => set('nome', e.target.value)}
              placeholder="Ex.: Residencial Pinheiros — Bloco A" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" value={form.endereco} onChange={(e) => set('endereco', e.target.value)}
              placeholder="Rua, número, bairro, cidade" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANEJAMENTO">Planejamento</SelectItem>
                <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                <SelectItem value="PAUSADA">Pausada</SelectItem>
                <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input id="data_inicio" type="date" value={form.data_inicio}
                onChange={(e) => set('data_inicio', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data_fim">Data de Término</Label>
              <Input id="data_fim" type="date" value={form.data_fim}
                onChange={(e) => set('data_fim', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              placeholder="Informações gerais sobre a obra..." rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Criar Obra'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
