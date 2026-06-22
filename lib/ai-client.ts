import { GoogleGenerativeAI } from '@google/generative-ai'

// Instância criada de forma lazy — evita throw em nível de módulo que
// impede o Next.js de registrar a rota (resulta em 404 em vez de 500)
let _genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY não configurada nas variáveis de ambiente.')
    _genAI = new GoogleGenerativeAI(key)
  }
  return _genAI
}

export function getAIModel() {
  return getGenAI().getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  })
}
