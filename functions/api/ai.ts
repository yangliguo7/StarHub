import { IRequest } from 'itty-router';

interface Env {
  AI: any;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  model?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { messages, model = '@cf/meta/llama-3-8b-instruct' } = (await context.request.json()) as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await context.env.AI.run(model, {
      messages,
      max_tokens: 1024,
      stream: false,
    });

    return new Response(JSON.stringify({ content: response.response }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('AI request failed:', error);
    return new Response(JSON.stringify({ error: error.message || 'AI request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
