import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import BrandingPDF from '@/components/configuracoes/BrandingPDF'

export default function PDFConfigPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/configuracoes"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Configurações
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">Personalização do PDF</span>
      </div>

      <BrandingPDF />
    </div>
  )
}
