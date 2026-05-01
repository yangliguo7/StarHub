/**
 * Cloudflare Pages Function for AI Chat
 * Proxies requests to Cloudflare Workers AI
 */

interface Env {
  AI: Ai
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface RequestBody {
  messages: ChatMessage[]
  model?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  
  try {
    const body: RequestBody = await request.json()
    const { messages, model = '@cf/meta/llama-3-8b-instruct' } = body
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'messages is required and must be a non-empty array' },
        { status: 400 }
      )
    }
    
    // 调用 Cloudflare Workers AI
    const response = await env.AI.run(model, {
      messages,
      temperature: 0.7,
      max_tokens: 2000
    })
    
    return Response.json(response)
  } catch (error: any) {
    console.error('AI API error:', error)
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
