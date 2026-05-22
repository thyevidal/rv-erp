import { createClient } from '@/lib/supabase/server'
import LegalDocEditor from './LegalDocEditor'

export default async function AdminDocumentosPage() {
  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('legal_documents')
    .select('conteudo, atualizado_em')
    .eq('tipo', 'politica-privacidade')
    .single()

  const content = doc?.conteudo ?? ''
  const updatedAt = doc?.atualizado_em
    ? new Date(doc.atualizado_em).toLocaleDateString('pt-BR', { dateStyle: 'long' })
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documentos Legais</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Edite a Política de Privacidade exibida publicamente.
          {updatedAt && <span className="ml-2 text-xs">Última atualização: {updatedAt}</span>}
        </p>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold">Política de Privacidade</h2>
        <LegalDocEditor tipo="politica-privacidade" initialContent={content} />
      </div>
    </div>
  )
}
