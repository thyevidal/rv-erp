'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { TableProperties } from 'lucide-react'

interface Props {
    totalMaterial: number
    totalMaoObra: number
    totalCustoGeral: number
    totalCI: number
    totalSeguros: number
    totalMargem: number
    totalImpostos: number
    totalVendaGeral: number
    mediaCI: number
    mediaSeguros: number
    mediaMargem: number
    mediaImpostos: number
}

export default function ComposicaoModal(props: Props) {
    const [open, setOpen] = useState(false)
    const {
        totalMaterial, totalMaoObra, totalCustoGeral,
        totalCI, totalSeguros, totalMargem, totalImpostos, totalVendaGeral,
        mediaCI, mediaSeguros, mediaMargem, mediaImpostos,
    } = props

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/60 rounded-md px-2.5 py-1 hover:bg-muted/30 transition-colors"
            >
                <TableProperties className="w-3.5 h-3.5" />
                Ver detalhamento
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Composição Geral dos Orçamentos</DialogTitle>
                    </DialogHeader>
                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b">
                                    <td className="px-4 py-2.5 text-muted-foreground">Material</td>
                                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground/60">custo direto</td>
                                    <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(totalMaterial)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-4 py-2.5 text-muted-foreground">Mão de Obra</td>
                                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground/60">custo direto</td>
                                    <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(totalMaoObra)}</td>
                                </tr>
                                <tr className="border-b bg-muted/20">
                                    <td className="px-4 py-2.5 font-semibold">Custo Direto Total</td>
                                    <td className="px-4 py-2.5" />
                                    <td className="px-4 py-2.5 text-right font-bold">{formatCurrency(totalCustoGeral)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-4 py-2.5 text-muted-foreground">Custos Indiretos</td>
                                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground/60">média {mediaCI.toFixed(1)}%</td>
                                    <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(totalCI)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-4 py-2.5 text-muted-foreground">Seguros</td>
                                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground/60">média {mediaSeguros.toFixed(1)}%</td>
                                    <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(totalSeguros)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-4 py-2.5 text-muted-foreground">Margem de Lucro</td>
                                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground/60">média {mediaMargem.toFixed(1)}%</td>
                                    <td className="px-4 py-2.5 text-right font-medium text-green-500">{formatCurrency(totalMargem)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-4 py-2.5 text-muted-foreground">Impostos</td>
                                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground/60">média {mediaImpostos.toFixed(1)}%</td>
                                    <td className="px-4 py-2.5 text-right font-medium text-yellow-500">{formatCurrency(totalImpostos)}</td>
                                </tr>
                                <tr className="bg-primary/5">
                                    <td className="px-4 py-3 font-bold text-primary">Preço de Venda Total</td>
                                    <td className="px-4 py-3" />
                                    <td className="px-4 py-3 text-right font-bold text-primary text-base">{formatCurrency(totalVendaGeral)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}