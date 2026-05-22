'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Props {
  tipo: string
  initialContent: string
}

export default function LegalDocEditor({ tipo, initialContent }: Props) {
  const supabase = createClient()
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('legal_documents')
      .upsert({ tipo, conteudo: content, atualizado_em: new Date().toISOString() }, { onConflict: 'tipo' })
    setSaving(false)
    if (error) {
      toast.error('Erro ao salvar: ' + error.message)
    } else {
      toast.success('Documento salvo com sucesso!')
    }
  }

  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-96 p-4 text-sm font-mono border border-border/60 rounded-lg bg-background resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
        placeholder="Conteúdo do documento..."
      />
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Salvar
        </button>
      </div>
    </div>
  )
}
