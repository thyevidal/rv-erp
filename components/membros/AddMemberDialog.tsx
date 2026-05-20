'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { createMemberAction } from '@/app/dashboard/configuracoes/membros/actions'

export default function AddMemberDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lgpdAceito, setLgpdAceito] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!lgpdAceito) {
      toast.error('O colaborador deve aceitar a Política de Privacidade para ser cadastrado.')
      return
    }
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('lgpd_aceito', 'true')

    // Server Action
    const result = await createMemberAction(formData)

    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
      return
    }

    toast.success('Membro cadastrado com sucesso!')
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm">
          <UserPlus className="w-4 h-4" />
          Adicionar Membro
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Membro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" name="name" placeholder="Ex.: João da Silva" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="joao@construtora.com.br" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Senha Temporária</Label>
            <Input id="password" name="password" type="text" placeholder="Senha123" required minLength={6} />
          </div>

          <div className="space-y-1.5">
            <Label>Nível de Acesso (Cargo)</Label>
            <Select defaultValue="member" name="role">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                <SelectItem value="member">Membro / Funcionário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/30 p-3 rounded-md space-y-4 border border-border/50">
            <Label className="text-muted-foreground uppercase text-xs tracking-wider font-semibold">
              Permissões Específicas
            </Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Financeiro</Label>
                <p className="text-xs text-muted-foreground">Ver orçamentos, BDI, custos e valores de venda</p>
              </div>
              <Switch name="canViewFinance" value="true" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Excluir Registros</Label>
                <p className="text-xs text-muted-foreground">Apagar itens de orçamentos e enviar obras para lixeira</p>
              </div>
              <Switch name="canDeleteRecords" value="true" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Gerenciar Estoque</Label>
                <p className="text-xs text-muted-foreground">Adicionar e confirmar baixas no estoque de materiais</p>
              </div>
              <Switch name="canEditInventory" value="true" />
            </div>
          </div>

          {/* Consentimento LGPD */}
          <div className="flex items-start gap-3 p-3 rounded-md border border-border/60 bg-muted/20">
            <input
              type="checkbox"
              id="lgpd"
              checked={lgpdAceito}
              onChange={(e) => setLgpdAceito(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
            />
            <label htmlFor="lgpd" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              Confirmo que o colaborador leu e aceitou a{' '}
              <Link
                href="/politica-de-privacidade"
                target="_blank"
                className="text-primary underline"
              >
                Política de Privacidade
              </Link>{' '}
              do Prumo ERP, conforme exigido pela LGPD (Lei nº 13.709/2018).
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !lgpdAceito} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Cadastrando...' : 'Cadastrar Membro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
