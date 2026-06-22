import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIModel } from '@/lib/ai-client'
import { buildObraSystemPrompt } from '@/lib/ai-prompts'
import { OBRA_TOOLS, executeTool, type PendingChanges } from '@/lib/ai-tools'
import type { Content } from '@google/generative-ai'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { id: obraId } = await params

  const { data: obra } = await supabase
    .from('obras')
    .select('*')
    .eq('id', obraId)
    .single()

  if (!obra) {
    return NextResponse.json({ error: 'Obra não encontrada.' }, { status: 404 })
  }

  const body = await request.json()
  const { messages }: { messages: { role: 'user' | 'model'; text: string }[] } = body

  if (!messages?.length) {
    return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })
  }

  const WINDOW = 20
  const windowedMessages = messages.slice(-WINDOW)

  const history: Content[] = windowedMessages.slice(0, -1).map(m => ({
    role: m.role,
    parts: [{ text: m.text }],
  }))

  const lastMessage = windowedMessages[windowedMessages.length - 1].text

  const model = getAIModel()
  const systemPrompt = buildObraSystemPrompt(obra)

  const chat = model.startChat({
    systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
    tools: OBRA_TOOLS,
    history,
  })

  let response = await chat.sendMessage(lastMessage)
  const allPendingChanges: PendingChanges[] = []

  while (true) {
    const candidate = response.response.candidates?.[0]
    const parts = candidate?.content?.parts ?? []
    const toolCalls = parts.filter(p => p.functionCall)

    if (!toolCalls.length) break

    const toolResults = await Promise.all(
      toolCalls.map(async part => {
        const fn = part.functionCall!
        const result = await executeTool(fn.name, (fn.args ?? {}) as Record<string, unknown>)

        if (result.pendingChanges) {
          allPendingChanges.push(result.pendingChanges)
        }

        return {
          functionResponse: {
            name: fn.name,
            response: { result: result.text },
          },
        }
      })
    )

    response = await chat.sendMessage(toolResults)
  }

  const text = response.response.text()

  return NextResponse.json({
    reply: text,
    ...(allPendingChanges.length > 0 && { pendingChanges: allPendingChanges[0] }),
  })
}
