'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#3C3489', '#7F77DD', '#22c55e', '#38bdf8', '#CECBF6']

type StatusData = { name: string; value: number }
type ObraBar = { name: string; custo: number }

interface Props {
  statusData: StatusData[]
  obrasData: ObraBar[]
}

export default function DashboardCharts({ statusData, obrasData }: Props) {
  const hasStatus = statusData.some((d) => d.value > 0)
  const hasObras = obrasData.some((d) => d.custo > 0)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Donut — Status */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Obras por Status</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasStatus ? (
            <p className="text-muted-foreground text-sm text-center py-8">Sem dados ainda</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData.filter((d) => d.value > 0)}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bars — Custo por Obra */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Orçamento por Obra (R$)</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasObras ? (
            <p className="text-muted-foreground text-sm text-center py-8">Sem dados ainda</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={obrasData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="custo" fill="#3C3489" radius={[4, 4, 0, 0]} name="Custo" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
