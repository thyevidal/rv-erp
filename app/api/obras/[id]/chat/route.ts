import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAIModel } from '@/lib/ai-client'
import { buildObraSystemPrompt } from '@/lib/ai-prompts'
import { OBRA_TOOLS, executeTool } from '@/lib/ai-tools'
import type { Content } from '@google/generative-ai'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Valida sessão
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { id: obraId } = await params

  // Usa o client com sessão do usuário — RLS garante que só retorna obras da org do usuário
  const { data: obra } = await supabase
    .from('obras')
    .select('*')
    .eq('id', obraId)
    .single()

  if (!obra) {
    return NextResponse.json({ error: 'Obra não encontrada.' }, { status: 404 })
  }

  const admin = createAdminClient()

  const body = await request.json()
  const { messages }: { messages: { role: 'user' | 'model'; text: string }[] } = body

  if (!messages?.length) {
    return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })
  }

  // Monta histórico no formato do Gemini
  const history: Content[] = messages.slice(0, -1).map(m => ({
    role: m.role,
    parts: [{ text: m.text }],
  }))

  const lastMessage = messages[messages.length - 1].text

  const model = getAIModel()
  const systemPrompt = buildObraSystemPrompt(obra)

  const chat = model.startChat({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    tools: OBRA_TOOLS,
    history,
  })

  // Loop de tool use — Gemini pode chamar tools várias vezes antes de responder
  let response = await chat.sendMessage(lastMessage)

  while (true) {
    const candidate = response.response.candidates?.[0]
    const parts = candidate?.content?.parts ?? []
    const toolCalls = parts.filter(p => p.functionCall)

    if (!toolCalls.length) break

    // Executa todas as tools solicitadas em paralelo
    const toolResults = await Promise.all(
      toolCalls.map(async part => {
        const fn = part.functionCall!
        const result = await executeTool(fn.name, (fn.args ?? {}) as Record<string, string>)
        return {
          functionResponse: {
            name: fn.name,
            response: { result },
          },
        }
      })
    )

    response = await chat.sendMessage(toolResults)
  }

  const text = response.response.text()

  return NextResponse.json({ reply: text })
}
