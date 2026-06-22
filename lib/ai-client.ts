import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY não configurada nas variáveis de ambiente.')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export function getAIModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  })
}
