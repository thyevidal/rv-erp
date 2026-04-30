'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import {
    Plus, Trash2, Loader2, TrendingUp, TrendingDown, DollarSign,
    ArrowUpCircle, ArrowDownCircle, Paperclip, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'

interface Lancamento {
    id: string
    data: string
    descricao: string
    tipo: 'ENTRADA' | 'SAIDA'
    categoria: string
    valor: number
    forma_pagamento: string | null
    comprovante_url: string | null
    observacao: string | null
}

interface BdiConfig {
    bdi_total: number
    impostos: number
    margem_lucro: number
    seguros: number
    custos_indiretos: number
}

interface Props {
    obraId: string
    organizationId: string
    lancamentos: Lancamento[]
    totalPlanejado: number
    custoPlanejado: number
    custoMaterial: number
    custoMaoObra: number
    bdi: BdiConfig | null
}

const CATEGORIAS_SAIDA = [
    'Material', 'Mão de Obra', 'Equipamento', 'Transporte',
    'Impostos', 'Alimentação', 'Outros',
]
const CATEGORIAS_ENTRADA = [
    'Pagamento Cliente', 'Adiantamento', 'Outros',
]
const FORMAS_PAGAMENTO = ['Dinheiro', 'PIX', 'Transferência', 'Boleto', 'Cheque', 'Cartão']

const EMPTY = {
    data: new Date().toISOString().slice(0, 10),
    descricao: '',
    tipo: 'SAIDA' as 'ENTRADA' | 'SAIDA',
    categoria: '',
    valor: '',
    forma_pagamento: '',
    observacao: '',
}

export default function FinanceiroTab({
    obraId, organizationId, lancamentos, totalPlanejado, custoPlanejado, custoMaterial, custoMaoObra, bdi
}: Props) {
    const router = useRouter()
    const supabase = createClient()
    const fileRef = useRef<HTMLInputElement>(null)
    const [open, setOpen] = useState(false)
    const [composicaoOpen, setComposicaoOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [uploadingFor, setUploadingFor] = useState<string | null>(null)
    const [form, setForm] = useState({ ...EMPTY })

    function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

    // Totais
    const totalEntradas = lancamentos
        .filter((l) => l.tipo === 'ENTRADA')
        .reduce((a, l) => a + l.valor, 0)

    const totalSaidas = lancamentos
        .filter((l) => l.tipo === 'SAIDA')
        .reduce((a, l) => a + l.valor, 0)

    const saldoAtual = totalEntradas - totalSaidas

    // Composição do orçamento
    const bdiTotal = bdi?.bdi_total ?? 0
    const impostosValor = totalPlanejado * ((bdi?.impostos ?? 0) / 100)
    const margemValor = totalPlanejado * ((bdi?.margem_lucro ?? 0) / 100)
    const segurosValor = totalPlanejado * ((bdi?.seguros ?? 0) / 100)
    const ciValor = totalPlanejado * ((bdi?.custos_indiretos ?? 0) / 100)

    // % executado do orçamento
    const pctGasto = custoPlanejado > 0 ? (totalSaidas / custoPlanejado) * 100 : 0
    const pctRecebido = totalPlanejado > 0 ? (totalEntradas / totalPlanejado) * 100 : 0

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        if (!form.descricao || !form.valor || !form.categoria) {
            toast.error('Preencha descrição, categoria e valor')
            return
        }
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('financeiro_lancamentos').insert({
            obra_id: obraId,
            organization_id: organizationId,
            data: form.data,
            descricao: form.descricao,
            tipo: form.tipo,
            categoria: form.categoria,
            valor: parseFloat(form.valor) || 0,
            forma_pagamento: form.forma_pagamento || null,
            observacao: form.observacao || null,
        })

        setLoading(false)
        if (error) { toast.error(error.message); return }
        toast.success('Lançamento registrado!')
        setOpen(false)
        setForm({ ...EMPTY })
        router.refresh()
    }

    async function handleDelete(id: string) {
        if (!confirm('Remover este lançamento?')) return
        const { error } = await supabase.from('financeiro_lancamentos').delete().eq('id', id)
        if (error) { toast.error(error.message); return }
        toast.success('Lançamento removido')
        router.refresh()
    }

    async function handleUpload(lancamentoId: string, file: File) {
        setUploadingFor(lancamentoId)
        const path = `${obraId}/${lancamentoId}/${file.name}`
        const { error: uploadErr } = await supabase.storage
            .from('financeiro-comprovantes').upload(path, file, { upsert: true })
        if (uploadErr) { toast.error(uploadErr.message); setUploadingFor(null); return }
        const { data: { publicUrl } } = supabase.storage.from('financeiro-comprovantes').getPublicUrl(path)
        await supabase.from('financeiro_lancamentos').update({ comprovante_url: publicUrl }).eq('id', lancamentoId)
        setUploadingFor(null)
        toast.success('Comprovante anexado!')
        router.refresh()
    }

    const categorias = form.tipo === 'ENTRADA' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA

    return (
        <div className="space-y-6">

            {/* Composição do Orçamento — Accordion */}
            <Card className="border-border/60 overflow-hidden">
                <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                    onClick={() => setComposicaoOpen((p) => !p)}
                >
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Composição do Orçamento
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-primary">{formatCurrency(totalPlanejado)}</span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${composicaoOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {composicaoOpen && (
                    <div className="border-t overflow-x-auto">
                        <table className="w-full min-w-[320px] text-sm">
                            <tbody>
                                <tr className="border-b">
                                    <td className="px-4 py-2.5 text-muted-foreground">Material (custo direto)</td>
                                    <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(custoMaterial)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-4 py-2.5 text-muted-foreground">Mão de Obra (custo direto)</td>
                                    <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(custoMaoObra)}</td>
                                </tr>
                                <tr className="border-b bg-muted/20">
                                    <td className="px-4 py-2.5 font-semibold">Custo Direto Total</td>
                                    <td className="px-4 py-2.5 text-right font-bold">{formatCurrency(custoPlanejado)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-4 py-2.5 text-muted-foreground">
                                        Custos Indiretos <span className="text-xs text-muted-foreground/60">({bdi?.custos_indiretos ?? 0}%)</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(ciValor)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-4 py-2.5 text-muted-foreground">
                                        Seguros <span className="text-xs text-muted-foreground/60">({bdi?.seguros ?? 0}%)</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(segurosValor)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-4 py-2.5 text-muted-foreground">
                                        Margem de Lucro <span className="text-xs text-muted-foreground/60">({bdi?.margem_lucro ?? 0}%)</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(margemValor)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-4 py-2.5 text-muted-foreground">
                                        Impostos <span className="text-xs text-muted-foreground/60">({bdi?.impostos ?? 0}%)</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(impostosValor)}</td>
                                </tr>
                                <tr className="bg-primary/5">
                                    <td className="px-4 py-3 font-bold text-primary">Preço de Venda Total</td>
                                    <td className="px-4 py-3 text-right font-bold text-primary text-base">{formatCurrency(totalPlanejado)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Painel comparativo */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card className="border-border/60">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <p className="text-xs text-muted-foreground">Receita Prevista</p>
                        </div>
                        <p className="text-lg font-bold">{formatCurrency(totalPlanejado)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Preço de venda (BDI)</p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ArrowUpCircle className="w-4 h-4 text-green-500" />
                            <p className="text-xs text-muted-foreground">Recebido</p>
                        </div>
                        <p className="text-lg font-bold text-green-500">{formatCurrency(totalEntradas)}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all"
                                    style={{ width: `${Math.min(pctRecebido, 100)}%` }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground">{pctRecebido.toFixed(0)}%</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ArrowDownCircle className="w-4 h-4 text-red-400" />
                            <p className="text-xs text-muted-foreground">Gasto</p>
                        </div>
                        <p className="text-lg font-bold text-red-400">{formatCurrency(totalSaidas)}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-400 rounded-full transition-all"
                                    style={{ width: `${Math.min(pctGasto, 100)}%` }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground">{pctGasto.toFixed(0)}%</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-border/60 ${saldoAtual >= 0 ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className={`w-4 h-4 ${saldoAtual >= 0 ? 'text-green-500' : 'text-red-400'}`} />
                            <p className="text-xs text-muted-foreground">Saldo Atual</p>
                        </div>
                        <p className={`text-lg font-bold ${saldoAtual >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                            {formatCurrency(saldoAtual)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Entradas − Saídas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Lançamentos ({lancamentos.length})
                </h2>
                <Button size="sm" className="gap-1.5" onClick={() => { setForm({ ...EMPTY }); setOpen(true) }}>
                    <Plus className="w-3.5 h-3.5" /> Novo Lançamento
                </Button>
            </div>

            {/* Lista de lançamentos */}
            {lancamentos.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground text-sm">
                        Nenhum lançamento registrado ainda.
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-border/60 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30 border-b">
                                <tr className="text-muted-foreground text-xs">
                                    <th className="text-left px-4 py-2.5 font-medium">Data</th>
                                    <th className="text-left px-2 py-2.5 font-medium">Descrição</th>
                                    <th className="text-left px-2 py-2.5 font-medium">Categoria</th>
                                    <th className="text-left px-2 py-2.5 font-medium">Pagamento</th>
                                    <th className="text-right px-4 py-2.5 font-medium">Valor</th>
                                    <th className="px-2 py-2.5" />
                                </tr>
                            </thead>
                            <tbody>
                                {lancamentos.map((l) => (
                                    <tr key={l.id} className="border-b hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                            {new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-2 py-3">
                                            <div className="flex items-center gap-2">
                                                {l.tipo === 'ENTRADA'
                                                    ? <ArrowUpCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                                    : <ArrowDownCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                                }
                                                <span className="font-medium">{l.descricao}</span>
                                            </div>
                                            {l.observacao && (
                                                <p className="text-xs text-muted-foreground mt-0.5 ml-5">{l.observacao}</p>
                                            )}
                                        </td>
                                        <td className="px-2 py-3">
                                            <Badge variant="outline" className="text-[10px]">{l.categoria}</Badge>
                                        </td>
                                        <td className="px-2 py-3 text-muted-foreground text-xs">
                                            {l.forma_pagamento ?? '—'}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${l.tipo === 'ENTRADA' ? 'text-green-500' : 'text-red-400'
                                            }`}>
                                            {l.tipo === 'ENTRADA' ? '+' : '-'}{formatCurrency(l.valor)}
                                        </td>
                                        <td className="px-2 py-3">
                                            <div className="flex items-center gap-1 justify-end">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-muted-foreground"
                                                    title="Anexar comprovante"
                                                    onClick={() => {
                                                        fileRef.current?.setAttribute('data-lancamento-id', l.id)
                                                        fileRef.current?.click()
                                                    }}
                                                >
                                                    {uploadingFor === l.id
                                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        : <Paperclip className={`w-3.5 h-3.5 ${l.comprovante_url ? 'text-primary' : ''}`} />
                                                    }
                                                </Button>
                                                {l.comprovante_url && (
                                                    <a
                                                        href={l.comprovante_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        Ver
                                                    </a>
                                                )}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-destructive"
                                                    onClick={() => handleDelete(l.id)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Totais no rodapé */}
                            <tfoot className="border-t bg-muted/20">
                                <tr>
                                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold">Total Entradas</td>
                                    <td className="px-4 py-3 text-right font-bold text-green-500">+{formatCurrency(totalEntradas)}</td>
                                    <td />
                                </tr>
                                <tr>
                                    <td colSpan={4} className="px-4 py-2 text-sm font-semibold">Total Saídas</td>
                                    <td className="px-4 py-2 text-right font-bold text-red-400">-{formatCurrency(totalSaidas)}</td>
                                    <td />
                                </tr>
                                <tr className="border-t">
                                    <td colSpan={4} className="px-4 py-3 text-sm font-bold">Saldo</td>
                                    <td className={`px-4 py-3 text-right font-bold text-lg ${saldoAtual >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                                        {formatCurrency(saldoAtual)}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>
            )}

            {/* Input upload oculto */}
            <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    const id = fileRef.current?.getAttribute('data-lancamento-id')
                    if (file && id) handleUpload(id, file)
                    if (fileRef.current) fileRef.current.value = ''
                }}
            />

            {/* Dialog novo lançamento */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Novo Lançamento</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-3 pt-1">

                        {/* Tipo */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm font-medium transition-colors ${form.tipo === 'ENTRADA'
                                        ? 'bg-green-500/10 border-green-500/40 text-green-500'
                                        : 'border-border/60 text-muted-foreground hover:bg-muted/30'
                                    }`}
                                onClick={() => { set('tipo', 'ENTRADA'); set('categoria', '') }}
                            >
                                <ArrowUpCircle className="w-4 h-4" /> Entrada
                            </button>
                            <button
                                type="button"
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm font-medium transition-colors ${form.tipo === 'SAIDA'
                                        ? 'bg-red-500/10 border-red-500/40 text-red-400'
                                        : 'border-border/60 text-muted-foreground hover:bg-muted/30'
                                    }`}
                                onClick={() => { set('tipo', 'SAIDA'); set('categoria', '') }}
                            >
                                <ArrowDownCircle className="w-4 h-4" /> Saída
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Data</Label>
                                <Input type="date" value={form.data} onChange={(e) => set('data', e.target.value)} required />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Valor (R$)</Label>
                                <Input type="number" step="any" value={form.valor} onChange={(e) => set('valor', e.target.value)} placeholder="0,00" required />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Descrição *</Label>
                            <Input value={form.descricao} onChange={(e) => set('descricao', e.target.value)} placeholder="Ex.: Pagamento NF fornecedor X" required />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Categoria *</Label>
                                <Select value={form.categoria} onValueChange={(v) => set('categoria', v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Forma de Pagamento</Label>
                                <Select value={form.forma_pagamento} onValueChange={(v) => set('forma_pagamento', v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Observação</Label>
                            <Input value={form.observacao} onChange={(e) => set('observacao', e.target.value)} placeholder="Opcional..." />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
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