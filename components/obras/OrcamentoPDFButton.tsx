'use client'

import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface Props {
    obraId: string
}

export default function OrcamentoPDFButton({ obraId }: Props) {
    const [loading, setLoading] = useState(false)

    async function handleOpen() {
        setLoading(true)
        try {
            window.open(`/api/obras/${obraId}/orcamento-pdf`, '_blank')
        } finally {
            setTimeout(() => setLoading(false), 1500)
        }
    }

    return (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={handleOpen} disabled={loading}>
            {loading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <FileText className="w-3.5 h-3.5" />
            }
            {loading ? 'Gerando...' : 'Exportar Orçamento'}
        </Button>
    )
}