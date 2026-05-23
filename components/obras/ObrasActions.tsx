'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Plus, Loader2, Building2, Landmark } from 'lucide-react'
import { toast } from 'sonner'

interface Props { primary?: boolean }

const CHECKLIST_AC: { fase: number; item: string; ordem: number }[] = [
  // Fase 1
  { fase: 1, item: 'Encaminhar documentação do cliente ao correspondente', ordem: 1 },
  { fase: 1, item: 'Obter simulação e aprovação de crédito', ordem: 2 },
  { fase: 1, item: 'Definir budget total (terreno + construção + taxas)', ordem: 3 },
  // Fase 2
  { fase: 2, item: 'Obter Certidão de Ônus Reais do terreno', ordem: 1 },
  { fase: 2, item: 'Obter Certidão Negativa de Débitos Municipais', ordem: 2 },
  { fase: 2, item: 'Confirmar desmembramento e matrícula do lote', ordem: 3 },
  { fase: 2, item: 'Desenvolver projeto arquitetônico dentro do budget', ordem: 4 },
  { fase: 2, item: 'Contratar projetos complementares (estrutural, elétrico, hidro)', ordem: 5 },
  { fase: 2, item: 'Obter ARTs dos engenheiros responsáveis', ordem: 6 },
  // Fase 3
  { fase: 3, item: 'Submeter projeto arquitetônico na prefeitura', ordem: 1 },
  { fase: 3, item: 'Obter Alvará de Construção', ordem: 2 },
  { fase: 3, item: 'Preencher PCI — Orçamento resumo por etapas', ordem: 3 },
  { fase: 3, item: 'Preencher PCI — Cronograma físico-financeiro', ordem: 4 },
  { fase: 3, item: 'Enviar PCI completa ao correspondente', ordem: 5 },
  { fase: 3, item: 'Aguardar validação da PCI pela Caixa', ordem: 6 },
  // Fase 4
  { fase: 4, item: 'Cliente pagar taxa de engenharia do banco', ordem: 1 },
  { fase: 4, item: 'Vistoria inicial do engenheiro credenciado (terreno vazio)', ordem: 2 },
  { fase: 4, item: 'Assinatura do contrato na agência (cliente + construtor + vendedor)', ordem: 3 },
  { fase: 4, item: 'Registro do contrato em cartório (CRI)', ordem: 4 },
  { fase: 4, item: 'Confirmação do pagamento do terreno ao vendedor', ordem: 5 },
  // Fase 5
  { fase: 5, item: 'Iniciar obra com recursos próprios / adiantamento', ordem: 1 },
  { fase: 5, item: 'Solicitar 1ª medição ao banco', ordem: 2 },
  { fase: 5, item: 'Acompanhar vistoria do fiscal do banco', ordem: 3 },
  { fase: 5, item: 'Confirmar liberação da 1ª parcela', ordem: 4 },
  { fase: 5, item: 'Repetir ciclo de medições mensais até conclusão', ordem: 5 },
  // Fase 6
  { fase: 6, item: 'Acionar prefeitura para vistoria e emissão do Habite-se', ordem: 1 },
  { fase: 6, item: 'Regularizar INSS da obra (CNO/SERO) e obter CND', ordem: 2 },
  { fase: 6, item: 'Averbar a construção no Cartório de Registro de Imóveis', ordem: 3 },
  { fase: 6, item: 'Entregar matrícula atualizada ao banco', ordem: 4 },
  { fase: 6, item: 'Confirmar liberação da última parcela retida', ordem: 5 },
]

export default function ObrasActions({ primary }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<'COMUM' | 'AQUISICAO_CONSTRUCAO'>('COMUM')
  const [form, setForm] = useState({
    nome: '', endereco: '', status: 'PLANEJAMENTO', data_inicio: '', data_fim: '', descricao: '',
    cliente_nome: '', cliente_cpf: '', credito_aprovado: '', recursos_proprios: '',
    correspondente_nome: '', correspondente_email: '',
  })

  function set(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { toast.error('Informe o nome da obra'); return }
    setLoading(true)

    // Usa API route com service role para bypassar RLS (inclui verificação de plano)
    const res = await fetch('/api/obras/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo,
        obra: {
          nome: form.nome,
          endereco: form.endereco || null,
          status: form.status,
          data_inicio: form.data_inicio || null,
          data_fim: form.data_fim || null,
          descricao: form.descricao || null,
          ...(tipo === 'AQUISICAO_CONSTRUCAO' ? {
            cliente_nome: form.cliente_nome || null,
            cliente_cpf: form.cliente_cpf || null,
            credito_aprovado: parseFloat(form.credito_aprovado.replace(/\./g, '').replace(',', '.')) || null,
            recursos_proprios: parseFloat(form.recursos_proprios.replace(/\./g, '').replace(',', '.')) || null,
            correspondente_nome: form.correspondente_nome || null,
            correspondente_email: form.correspondente_email || null,
          } : {}),
        },
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Erro ao criar obra.')
      setLoading(false)
      return
    }
    const obra = json.obra

    // Enviar e-mail de convite para o correspondente (se AC e tiver e-mail)
    if (tipo === 'AQUISICAO_CONSTRUCAO' && form.correspondente_email && json.acessosCriados) {
      const correspondAcesso = json.acessosCriados.find((a: { tipo: string }) => a.tipo === 'CORRESPONDENTE')
      if (correspondAcesso) {
        fetch('/api/email/convite-portal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.correspondente_email,
            nomeObra: obra.nome,
            token: correspondAcesso.token,
            tipo: 'CORRESPONDENTE',
          }),
        }).catch(() => { /* falha silenciosa */ })
      }
    }

    setLoading(false)
    toast.success('Obra criada com sucesso!')
    setOpen(false)
    setForm({ nome: '', endereco: '', status: 'PLANEJAMENTO', data_inicio: '', data_fim: '', descricao: '', cliente_nome: '', cliente_cpf: '', credito_aprovado: '', recursos_proprios: '', correspondente_nome: '', correspondente_email: '' })
    setTipo('COMUM')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm"><Plus className="w-4 h-4" />Nova Obra</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nova Obra</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">

          {/* Tipo de obra */}
          <div className="space-y-2">
            <Label>Tipo de obra</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('COMUM')}
                className={`flex flex-col items-start gap-2 p-4 rounded-lg border-2 text-left transition-all ${tipo === 'COMUM' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className={`w-5 h-5 ${tipo === 'COMUM' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-medium text-sm">Obra comum</span>
                </div>
                <span className="text-xs text-muted-foreground">Reforma ou construção sem financiamento bancário estruturado.</span>
              </button>
              <button
                type="button"
                onClick={() => setTipo('AQUISICAO_CONSTRUCAO')}
                className={`flex flex-col items-start gap-2 p-4 rounded-lg border-2 text-left transition-all ${tipo === 'AQUISICAO_CONSTRUCAO' ? 'border-green-500 bg-green-500/5' : 'border-border hover:border-green-500/40'}`}
              >
                <div className="flex items-center gap-2">
                  <Landmark className={`w-5 h-5 ${tipo === 'AQUISICAO_CONSTRUCAO' ? 'text-green-600' : 'text-muted-foreground'}`} />
                  <span className="font-medium text-sm">Aquisição e construção</span>
                </div>
                <span className="text-xs text-muted-foreground">Financiamento Caixa. Processo guiado em 6 fases.</span>
              </button>
            </div>
          </div>

          <Separator />

          {/* Dados básicos */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome da obra *</Label>
              <Input value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex.: Residência João Silva" required />
            </div>
            <div className="space-y-1.5">
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={(e) => set('endereco', e.target.value)} placeholder="Rua, número, bairro, cidade" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANEJAMENTO">Planejamento</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data início</Label>
                <Input type="date" value={form.data_inicio} onChange={(e) => set('data_inicio', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Data término</Label>
                <Input type="date" value={form.data_fim} onChange={(e) => set('data_fim', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Campos AC */}
          {tipo === 'AQUISICAO_CONSTRUCAO' && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Dados do financiamento Caixa</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Nome do cliente *</Label>
                    <Input value={form.cliente_nome} onChange={(e) => set('cliente_nome', e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CPF do cliente</Label>
                    <Input value={form.cliente_cpf} onChange={(e) => set('cliente_cpf', e.target.value)} placeholder="000.000.000-00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Crédito aprovado (R$)</Label>
                    <Input value={form.credito_aprovado} onChange={(e) => set('credito_aprovado', e.target.value)} placeholder="500.000,00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Recursos próprios (R$)</Label>
                    <Input value={form.recursos_proprios} onChange={(e) => set('recursos_proprios', e.target.value)} placeholder="100.000,00" />
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Correspondente bancário</Label>
                    <Input value={form.correspondente_nome} onChange={(e) => set('correspondente_nome', e.target.value)} placeholder="Nome do correspondente" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail do correspondente</Label>
                    <Input type="email" value={form.correspondente_email} onChange={(e) => set('correspondente_email', e.target.value)} placeholder="email@correspondente.com" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">O checklist das 6 fases será criado automaticamente. Os links de acesso para o cliente e correspondente serão gerados após criar a obra.</p>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : 'Criar obra'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}