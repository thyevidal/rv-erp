'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { OrcamentoItem, EstoqueLog } from '@/types'
import { PackageCheck, Plus, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props { obraId: string; itens: OrcamentoItem[]; logs: EstoqueLog[] }

export default function EstoqueTab({ obraId, itens, logs }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    orcamento_item_id: '', quantidade_entregue: '', data_entrega: new Date().toISOString().split('T')[0],
    nota_fiscal: '', fornecedor: '', confirmado_por: '', observacao: ''
  })

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  const selectedItem = itens.find((i) => i.id === form.orcamento_item_id)
  const totalEntregue = (itemId: string) =>
    logs.filter((l) => l.orcamento_item_id === itemId).reduce((a, l) => a + l.quantidade_entregue, 0)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.orcamento_item_id || !form.quantidade_entregue) {
      toast.error('Selecione o item e informe a quantidade'); return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const item = itens.find((i) => i.id === form.orcamento_item_id)
    const { error } = await supabase.from('estoque_logs').insert({
      obra_id: obraId,
      orcamento_item_id: form.orcamento_item_id,
      descricao: item?.descricao ?? '',
      unidade: item?.unidade ?? 'un',
      quantidade_entregue: parseFloat(form.quantidade_entregue),
      data_entrega: form.data_entrega,
      nota_fiscal: form.nota_fiscal || null,
      fornecedor: form.fornecedor || null,
      confirmado_por: form.confirmado_por || null,
      observacao: form.observacao || null,
      user_id: user!.id,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Recebimento confirmado!')
    setOpen(false)
    setForm({ orcamento_item_id: '', quantidade_entregue: '', data_entrega: new Date().toISOString().split('T')[0], nota_fiscal: '', fornecedor: '', confirmado_por: '', observacao: '' })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Recebimento de Materiais</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Confirme a entrega de materiais no canteiro.</p>
        </div>
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <PackageCheck className="w-4 h-4" /> Confirmar Recebimento
        </Button>
      </div>

      {/* Resumo por item */}
      <div className="grid gap-3 sm:grid-cols-2">
        {itens.filter((i) => i.tipo === 'MATERIAL').map((item) => {
          const entregue = totalEntregue(item.id)
          const pct = item.quantidade > 0 ? Math.min((entregue / item.quantidade) * 100, 100) : 0
          const completo = pct >= 100
          return (
            <Card key={item.id} className={`border ${completo ? 'border-green-500/30 bg-green-500/5' : 'border-border/60'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-sm">{item.descricao}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.etapa}</p>
                  </div>
                  {completo && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Entregue: <strong>{entregue} {item.unidade}</strong></span>
                  <span>Total: <strong>{item.quantidade} {item.unidade}</strong></span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${completo ? 'bg-green-500' : 'bg-primary'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-right text-xs text-muted-foreground mt-1">{pct.toFixed(0)}%</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Histórico */}
      {logs.length > 0 && (
        <div>
          <h3 className="font-medium text-sm mb-3">Histórico de Recebimentos</h3>
          <Card className="border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="text-muted-foreground text-xs border-b">
                    <th className="text-left px-4 py-2.5 font-medium">Item</th>
                    <th className="text-right px-2 py-2.5 font-medium">Qtd</th>
                    <th className="text-center px-2 py-2.5 font-medium">Data</th>
                    <th className="text-left px-2 py-2.5 font-medium">Fornecedor</th>
                    <th className="text-left px-2 py-2.5 font-medium">NF</th>
                    <th className="text-left px-4 py-2.5 font-medium">Confirmado por</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium">{log.descricao}</td>
                      <td className="text-right px-2 py-2.5">{log.quantidade_entregue} {log.unidade}</td>
                      <td className="text-center px-2 py-2.5 text-xs">{formatDate(log.data_entrega)}</td>
                      <td className="px-2 py-2.5 text-muted-foreground text-xs">{log.fornecedor || '—'}</td>
                      <td className="px-2 py-2.5 text-muted-foreground text-xs">{log.nota_fiscal || '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{log.confirmado_por || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Recebimento</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Material *</Label>
              <select
                value={form.orcamento_item_id}
                onChange={(e) => set('orcamento_item_id', e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">Selecione o material...</option>
                {itens.filter((i) => i.tipo === 'MATERIAL').map((i) => (
                  <option key={i.id} value={i.id}>{i.descricao} ({i.unidade})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quantidade *</Label>
                <Input type="number" step="any" value={form.quantidade_entregue}
                  onChange={(e) => set('quantidade_entregue', e.target.value)}
                  placeholder={selectedItem ? `/ ${selectedItem.quantidade} ${selectedItem?.unidade}` : '0'}
                  required />
              </div>
              <div className="space-y-1.5">
                <Label>Data de Entrega</Label>
                <Input type="date" value={form.data_entrega} onChange={(e) => set('data_entrega', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nº Nota Fiscal</Label>
                <Input value={form.nota_fiscal} onChange={(e) => set('nota_fiscal', e.target.value)} placeholder="NF-e 000123" />
              </div>
              <div className="space-y-1.5">
                <Label>Fornecedor</Label>
                <Input value={form.fornecedor} onChange={(e) => set('fornecedor', e.target.value)} placeholder="Nome" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Confirmado por (Mestre)</Label>
              <Input value={form.confirmado_por} onChange={(e) => set('confirmado_por', e.target.value)} placeholder="Nome do mestre de obras" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Confirmar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
