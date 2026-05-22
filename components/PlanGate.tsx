import Link from 'next/link'
import { Lock } from 'lucide-react'

interface Props {
  allowed: boolean
  children?: React.ReactNode
  feature?: string
}

export default function PlanGate({ allowed, children, feature }: Props) {
  if (allowed) return <>{children}</>
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Recurso do plano Pro</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm">
        {feature ? `${feature} está` : 'Este recurso está'} disponível apenas no plano Pro (R$ 350/mês).
      </p>
      <Link href="/upgrade">
        <button className="inline-flex items-center px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          Ver planos e fazer upgrade
        </button>
      </Link>
    </div>
  )
}
