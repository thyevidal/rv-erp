'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MapPin, Calendar } from 'lucide-react'
import EditObraDialog from '@/components/obras/EditObraDialog'
import type { Obra } from '@/types'

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  PLANEJAMENTO: { label: 'Planejamento', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  EM_ANDAMENTO: { label: 'Em Andamento', classes: 'bg-primary/10 text-primary border-primary/30' },
  PAUSADA: { label: 'Pausada', classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  CONCLUIDA: { label: 'Concluída', classes: 'bg-green-500/10 text-green-400 border-green-500/30' },
  CANCELADA: { label: 'Cancelada', classes: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

interface Props {
  obra: Obra
  custo: number
}

export default function ObraCard({ obra, custo }: Props) {
  const cfg = STATUS_MAP[obra.status] ?? STATUS_MAP.PLANEJAMENTO

  return (
    <div className="relative group">
      {/* Card clicável que navega para a obra */}
      <Link href={`/dashboard/obras/${obra.id}`}>
        <Card className="h-full border-border/60 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-base leading-snug line-clamp-2 pr-2">{obra.nome}</h2>
              <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.classes}`}>
                {cfg.label}
              </span>
            </div>

            {obra.endereco && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="line-clamp-1">{obra.endereco}</span>
              </div>
            )}

            <div className="border-t pt-3 space-y-2 mt-auto">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Orçamento</span>
                <span className="font-semibold">{formatCurrency(custo)}</span>
              </div>
              {(obra.data_inicio || obra.data_fim) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(obra.data_inicio)} → {formatDate(obra.data_fim)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Botão de edição flutuante — click não propaga para o Link */}
      <div
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={(e) => e.preventDefault()}
      >
        <EditObraDialog
          obra={obra}
          trigger={
            <button
              className="p-1.5 rounded-md bg-background border border-border shadow-sm hover:bg-muted transition-colors"
              title="Editar obra"
            >
              <span className="sr-only">Editar</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13" height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </button>
          }
        />
      </div>
    </div>
  )
}
