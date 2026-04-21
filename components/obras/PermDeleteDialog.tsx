'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { Obra } from '@/types'

export default function PermDeleteDialog({ obra }: { obra: Obra }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    if (!senha) return

    setLoading(true)

    // 1. Pegar o e-mail do usuário atual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      toast.error('Erro ao identificar sessão.')
      setLoading(false)
      return
    }

    // 2. Verificar senha (tentando logar sem criar sessão do zero se já tiver)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: senha,
    })

    if (authError) {
      toast.error('Senha incorreta.')
      setLoading(false)
      return
    }

    // 3. Se passou, excluir a obra via DELETE CASCADE no banco
    const { error: deleteError } = await supabase
      .from('obras')
      .delete()
      .eq('id', obra.id)

    setLoading(false)

    if (deleteError) {
      toast.error('Erro ao excluir: ' + deleteError.message)
      return
    }

    toast.success('Obra excluída definitivamente.')
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="Excluir Definitivamente"
          className="p-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="sr-only">Excluir</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md border-destructive/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Exclusão Definitiva
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-2 text-foreground">
            Você está prestes a excluir a obra <strong>{obra.nome}</strong>.
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 font-medium">
              Aviso: Esta ação é irreversível. Todo o orçamento, cronograma, tarefas, itens do mapa de coleta e registro de estoque vinculados a esta obra serão apagados do sistema para sempre.
            </div>
            Para confirmar a exclusão, digite sua senha de acesso ao sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDelete} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="senha-delete">Senha</Label>
            <Input
              id="senha-delete"
              type="password"
              placeholder="Sua senha de login"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
