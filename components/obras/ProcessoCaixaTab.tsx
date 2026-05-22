'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CheckCircle2, Circle, ChevronRight, Upload, Download, Loader2, Copy, Link2, Eye, EyeOff } from 'lucide-react'

const FASES = [
    { n: 1, titulo: 'Análise de crédito', desc: 'Aprovação do crédito e definição do budget total do projeto.' },
    { n: 2, titulo: 'Terreno e projetos', desc: 'Documentação do terreno, projeto arquitetônico e projetos complementares com ARTs.' },
    { n: 3, titulo: 'Burocracia técnica', desc: 'Aprovação na prefeitura (Alvará) e preenchimento da PCI junto à Caixa.' },
    { n: 4, titulo: 'Engenharia e assinatura', desc: 'Vistoria inicial do banco, assinatura do contrato e registro em cartório.' },
    { n: 5, titulo: 'Execução e medições', desc: 'Execução da obra com ciclos de medição e liberação de parcelas.' },
    { n: 6, titulo: 'Legalização final', desc: 'Habite-se, regularização INSS, averbação e liberação da última parcela.' },
]

interface CheckItem { id: string; fase_numero: number; item: string; concluido: boolean; ordem: number }
interface Fase { id: string; fase_numero: number; status: string; notas: string | null }
interface Documento {
    id: string
    nome: string
    url: string
    enviado_por: string
    fase_numero: number | null
    visivel_cliente: boolean
    visivel_correspondente: boolean
    created_at: string
}
interface Acesso { id: string; tipo: string; token: string; nome: string | null; email: string | null; ativo: boolean }

interface Props {
    obraId: string
    fases: Fase[]
    checklist: CheckItem[]
    documentos: Documento[]
    acessos: Acesso[]
}

export default function ProcessoCaixaTab({ obraId, fases, checklist, documentos, acessos }: Props) {
    const router = useRouter()
    const supabase = createClient()
    const fileRef = useRef<HTMLInputElement>(null)
    const [faseSelecionada, setFaseSelecionada] = useState(
        fases.find(f => f.status === 'EM_ANDAMENTO')?.fase_numero ?? 1
    )
    const [uploading, setUploading] = useState(false)
    const [savingNota, setSavingNota] = useState(false)
    const [nota, setNota] = useState(fases.find(f => f.fase_numero === faseSelecionada)?.notas ?? '')
    const [togglingId, setTogglingId] = useState<string | null>(null)

    const faseAtual = fases.find(f => f.fase_numero === faseSelecionada)
    const checklistFase = checklist.filter(c => c.fase_numero === faseSelecionada).sort((a, b) => a.ordem - b.ordem)
    const docsFase = documentos.filter(d => d.fase_numero === faseSelecionada || d.fase_numero === null)
    const totalConcluidos = checklist.filter(c => c.concluido).length
    const totalItens = checklist.length
    const progresso = totalItens > 0 ? Math.round((totalConcluidos / totalItens) * 100) : 0

    const clienteAcesso = acessos.find(a => a.tipo === 'CLIENTE')
    const correspondAcesso = acessos.find(a => a.tipo === 'CORRESPONDENTE')

    // Separar documentos por remetente
    const docsConstrutor = docsFase.filter(d => d.enviado_por === 'CONSTRUTOR')
    const docsCorrespondente = docsFase.filter(d => d.enviado_por === 'CORRESPONDENTE')
    const docsCliente = docsFase.filter(d => d.enviado_por === 'CLIENTE')

    function getStatusFase(faseNum: number) {
        const f = fases.find(f => f.fase_numero === faseNum)
        return f?.status ?? 'PENDENTE'
    }

    function copyLink(token: string) {
        const url = `${window.location.origin}/portal/${token}`
        navigator.clipboard.writeText(url)
        toast.success('Link copiado!')
    }

    async function toggleCheck(item: CheckItem) {
        const { error } = await supabase.from('ac_checklist')
            .update({ concluido: !item.concluido })
            .eq('id', item.id)
        if (error) { toast.error(error.message); return }

        const otherItems = checklistFase.filter(c => c.id !== item.id)
        const allDone = otherItems.every(c => c.concluido) && !item.concluido
        const anyDone = otherItems.some(c => c.concluido) || !item.concluido

        let newStatus = 'PENDENTE'
        if (allDone) newStatus = 'CONCLUIDA'
        else if (anyDone) newStatus = 'EM_ANDAMENTO'

        await supabase.from('ac_fases').update({ status: newStatus }).eq('obra_id', obraId).eq('fase_numero', faseSelecionada)
        router.refresh()
    }

    async function saveNota() {
        setSavingNota(true)
        await supabase.from('ac_fases').update({ notas: nota }).eq('obra_id', obraId).eq('fase_numero', faseSelecionada)
        setSavingNota(false)
        toast.success('Nota salva!')
        router.refresh()
    }

    async function handleUpload(file: File) {
        setUploading(true)
        const path = `${obraId}/fase-${faseSelecionada}/${Date.now()}-${file.name}`
        const { error: upErr } = await supabase.storage.from('ac-documentos').upload(path, file)
        if (upErr) { toast.error(upErr.message); setUploading(false); return }
        const { data: { publicUrl } } = supabase.storage.from('ac-documentos').getPublicUrl(path)
        await supabase.from('ac_documentos').insert({
            obra_id: obraId,
            fase_numero: faseSelecionada,
            nome: file.name,
            url: publicUrl,
            enviado_por: 'CONSTRUTOR',
            visivel_cliente: false,
            visivel_correspondente: false,
        })
        setUploading(false)
        toast.success('Documento enviado!')
        router.refresh()
        if (fileRef.current) fileRef.current.value = ''
    }

    async function toggleVisibilidade(docId: string, campo: 'visivel_cliente' | 'visivel_correspondente', valor: boolean) {
        setTogglingId(docId + campo)
        const { error } = await supabase.from('ac_documentos').update({ [campo]: valor }).eq('id', docId)
        setTogglingId(null)
        if (error) { toast.error(error.message); return }
        toast.success(valor ? 'Documento liberado' : 'Documento ocultado')
        router.refresh()
    }

    return (
        <div className="space-y-4">
            {/* Links de acesso externos */}
            {(clienteAcesso || correspondAcesso) && (
                <div className="grid grid-cols-2 gap-3">
                    {clienteAcesso && (
                        <Card className="border-border/60">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Link2 className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Portal do cliente</span>
                                    <Badge variant="outline" className="text-xs ml-auto">{clienteAcesso.nome}</Badge>
                                </div>
                                <div className="flex gap-2">
                                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                                        /portal/{clienteAcesso.token.slice(0, 16)}...
                                    </code>
                                    <Button size="sm" variant="outline" className="h-7 gap-1 shrink-0" onClick={() => copyLink(clienteAcesso.token)}>
                                        <Copy className="w-3 h-3" /> Copiar link
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {correspondAcesso && (
                        <Card className="border-border/60">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Link2 className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Portal do correspondente</span>
                                    <Badge variant="outline" className="text-xs ml-auto">{correspondAcesso.nome}</Badge>
                                </div>
                                <div className="flex gap-2">
                                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                                        /portal/{correspondAcesso.token.slice(0, 16)}...
                                    </code>
                                    <Button size="sm" variant="outline" className="h-7 gap-1 shrink-0" onClick={() => copyLink(correspondAcesso.token)}>
                                        <Copy className="w-3 h-3" /> Copiar link
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            <div className="grid grid-cols-[220px_1fr] gap-4">
                {/* Sidebar fases */}
                <div className="space-y-2">
                    {FASES.map(({ n, titulo }) => {
                        const status = getStatusFase(n)
                        const done = status === 'CONCLUIDA'
                        const active = faseSelecionada === n
                        return (
                            <button
                                key={n}
                                onClick={() => { setFaseSelecionada(n); setNota(fases.find(f => f.fase_numero === n)?.notas ?? '') }}
                                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${active ? 'border-primary bg-primary/5' : 'border-border/60 hover:bg-muted/30'}`}
                            >
                                <div className="shrink-0">
                                    {done
                                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        : active
                                            ? <ChevronRight className="w-4 h-4 text-primary" />
                                            : <Circle className="w-4 h-4 text-muted-foreground/40" />
                                    }
                                </div>
                                <div className="min-w-0">
                                    <div className={`text-xs font-medium truncate ${active ? 'text-primary' : done ? 'text-muted-foreground' : 'text-foreground'}`}>
                                        {n}. {titulo}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                                        {done ? 'Concluída' : status === 'EM_ANDAMENTO' ? 'Em andamento' : 'Pendente'}
                                    </div>
                                </div>
                            </button>
                        )
                    })}

                    <Card className="border-border/60 mt-2">
                        <CardContent className="p-3">
                            <p className="text-xs text-muted-foreground mb-2">Progresso geral</p>
                            <div className="h-2 bg-muted rounded-full overflow-hidden mb-1.5">
                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progresso}%` }} />
                            </div>
                            <p className="text-xs font-medium text-primary">{totalConcluidos}/{totalItens} itens</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Conteúdo da fase */}
                <div className="space-y-4">
                    <Card className="border-border/60">
                        <CardContent className="p-6 space-y-5">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fase {faseSelecionada}</p>
                                <p className="text-lg font-semibold">{FASES[faseSelecionada - 1].titulo}</p>
                                <p className="text-sm text-muted-foreground mt-1">{FASES[faseSelecionada - 1].desc}</p>
                            </div>

                            {/* Checklist */}
                            <div>
                                <p className="text-sm font-medium mb-3">Checklist</p>
                                <div className="space-y-2">
                                    {checklistFase.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => toggleCheck(item)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${item.concluido ? 'border-green-500/20 bg-green-500/5' : 'border-border/60 hover:bg-muted/30'}`}
                                        >
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${item.concluido ? 'bg-green-500 border-green-500' : 'border-border'}`}>
                                                {item.concluido && <span className="text-white text-xs font-bold">✓</span>}
                                            </div>
                                            <span className={`text-sm ${item.concluido ? 'line-through text-muted-foreground' : ''}`}>
                                                {item.item}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Documentos */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-medium">Documentos</p>
                                    <Button size="sm" variant="outline" className="h-7 gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploading}>
                                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                        Enviar
                                    </Button>
                                    <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
                                </div>

                                {docsFase.length === 0 ? (
                                    <div
                                        onClick={() => fileRef.current?.click()}
                                        className="border border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/20 transition-colors"
                                    >
                                        <Upload className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Nenhum documento. Clique para enviar.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Documentos da construtora */}
                                        {docsConstrutor.length > 0 && (
                                            <DocSection
                                                titulo="📤 Enviados pela construtora"
                                                docs={docsConstrutor}
                                                showClienteToggle
                                                showCorrespToggle
                                                togglingId={togglingId}
                                                onToggle={toggleVisibilidade}
                                            />
                                        )}

                                        {/* Documentos do correspondente (aguardando aprovação ou já aprovados) */}
                                        {docsCorrespondente.length > 0 && (
                                            <DocSection
                                                titulo="📥 Enviados pelo correspondente"
                                                subtitulo="Libere para o cliente ver marcando o ícone 👤"
                                                docs={docsCorrespondente}
                                                showClienteToggle
                                                showCorrespToggle={false}
                                                togglingId={togglingId}
                                                onToggle={toggleVisibilidade}
                                            />
                                        )}

                                        {/* Documentos do cliente (aguardando aprovação ou já aprovados) */}
                                        {docsCliente.length > 0 && (
                                            <DocSection
                                                titulo="📥 Enviados pelo cliente"
                                                subtitulo="Libere para o correspondente ver marcando o ícone 📋"
                                                docs={docsCliente}
                                                showClienteToggle={false}
                                                showCorrespToggle
                                                togglingId={togglingId}
                                                onToggle={toggleVisibilidade}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Notas internas */}
                            <div>
                                <p className="text-sm font-medium mb-2">Notas internas</p>
                                <Textarea
                                    value={nota}
                                    onChange={(e) => setNota(e.target.value)}
                                    placeholder="Anotações sobre esta fase (visível apenas para a equipe)..."
                                    rows={3}
                                />
                                <div className="flex justify-end mt-2">
                                    <Button size="sm" onClick={saveNota} disabled={savingNota}>
                                        {savingNota && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                                        Salvar nota
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

// ── Sub-componente: seção de documentos com toggles de visibilidade ──────────
interface DocSectionProps {
    titulo: string
    subtitulo?: string
    docs: { id: string; nome: string; url: string; visivel_cliente: boolean; visivel_correspondente: boolean; created_at: string }[]
    showClienteToggle: boolean
    showCorrespToggle: boolean
    togglingId: string | null
    onToggle: (id: string, campo: 'visivel_cliente' | 'visivel_correspondente', valor: boolean) => void
}

function DocSection({ titulo, subtitulo, docs, showClienteToggle, showCorrespToggle, togglingId, onToggle }: DocSectionProps) {
    return (
        <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{titulo}</p>
            {subtitulo && (
                <p className="text-xs text-muted-foreground mb-2">{subtitulo}</p>
            )}
            <div className="space-y-2">
                {docs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/20">
                        <div className="text-lg">📄</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.nome}</p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                            </p>
                        </div>

                        {/* Toggles de visibilidade */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {showClienteToggle && (
                                <button
                                    title={doc.visivel_cliente ? 'Visível ao cliente — clique para ocultar' : 'Oculto do cliente — clique para liberar'}
                                    disabled={togglingId === doc.id + 'visivel_cliente'}
                                    onClick={() => onToggle(doc.id, 'visivel_cliente', !doc.visivel_cliente)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                        doc.visivel_cliente
                                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    {togglingId === doc.id + 'visivel_cliente'
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : doc.visivel_cliente
                                            ? <Eye className="w-3 h-3" />
                                            : <EyeOff className="w-3 h-3" />
                                    }
                                    <span>👤</span>
                                </button>
                            )}
                            {showCorrespToggle && (
                                <button
                                    title={doc.visivel_correspondente ? 'Visível ao correspondente — clique para ocultar' : 'Oculto do correspondente — clique para liberar'}
                                    disabled={togglingId === doc.id + 'visivel_correspondente'}
                                    onClick={() => onToggle(doc.id, 'visivel_correspondente', !doc.visivel_correspondente)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                        doc.visivel_correspondente
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    {togglingId === doc.id + 'visivel_correspondente'
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : doc.visivel_correspondente
                                            ? <Eye className="w-3 h-3" />
                                            : <EyeOff className="w-3 h-3" />
                                    }
                                    <span>📋</span>
                                </button>
                            )}
                        </div>

                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                                <Download className="w-3.5 h-3.5" />
                            </Button>
                        </a>
                    </div>
                ))}
            </div>
        </div>
    )
}
