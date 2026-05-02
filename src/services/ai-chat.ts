import { getAIConfig, getEffectiveModel, CLOUDFLARE_MODELS } from '@/config/ai'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export class AIChatService {
  private model: string
  
  constructor() {
    // 从配置读取模型，而不是硬编码
    this.model = getEffectiveModel()
  }
  
  // 刷新模型配置（用户修改设置后调用）
  refreshModel() {
    this.model = getEffectiveModel()
  }
  
  async chat(messages: ChatMessage[]): Promise<string> {
    const config = getAIConfig()

    // Cloudflare 使用 Pages Function 代理
    if (config.provider === 'cloudflare') {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model: this.model
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || `AI request failed: ${response.status}`)
      }

      const data = await response.json()
      return data.content || data.response || ''
    }

    const endpoint = config.baseURL || getDefaultEndpoint(config.provider)

    // Claude: Anthropic 原生格式
    if (config.provider === 'claude') {
      const systemMessage = messages.find(m => m.role === 'system')
      const userMessages = messages.filter(m => m.role !== 'system')

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2000,
          system: systemMessage?.content || '',
          messages: userMessages
        })
      })

      if (!response.ok) {
        throw new Error(`Claude API request failed: ${response.status}`)
      }

      const data = await response.json()
      return data.content?.[0]?.text || ''
    }

    // 其他平台: OpenAI 兼容格式
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages
      })
    })

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }
  
  // 解析用户搜索意图
  parseSearchIntent(message: string): {
    query?: string
    language?: string
    minStars?: number
  } {
    const result: any = {}
    
    // 提取语言
    const langMatch = message.match(/(javascript|typescript|python|go|rust|java|c\+\+|php|ruby|swift|kotlin)/i)
    if (langMatch) result.language = langMatch[1].toLowerCase()
    
    // 提取 star 数量
    const starMatch = message.match(/(\d+)\s*(?:stars?|星|star)/i)
    if (starMatch) result.minStars = parseInt(starMatch[1])
    
    // 提取关键词
    const keywords = message
      .replace(/javascript|typescript|python|go|rust|java|c\+\+|php|ruby|swift|kotlin/gi, '')
      .replace(/\d+\s*(?:stars?|星|star)/gi, '')
      .replace(/想找|找一个|推荐|搜索|查找|有没有|有没有什么/g, '')
      .trim()
    
    if (keywords.length > 2) {
      result.query = keywords
    }
    
    return result
  }
  
  // 获取系统提示词
  getSystemPrompt(): string {
    return `你是一个 GitHub 项目搜索助手。用户会用自然语言描述他们想要的项目，你需要：
1. 理解用户的需求
2. 推荐相关的 GitHub 项目
3. 解释为什么推荐这些项目
4. 如果用户给出具体的搜索条件，帮他们构造搜索建议

回复格式要求：
- 使用中文
- 条理清晰，使用列表格式
- 如果推荐项目，给出仓库名称和简介
- 保持简洁，不要太长`
  }
}

function getDefaultEndpoint(provider: string): string {
  const urls: Record<string, string> = {
    openai: 'https://api.openai.com/v1/chat/completions',
    claude: 'https://api.anthropic.com/v1/messages',
    qwen: 'https://dashscope.aliyun.com/compatible-mode/v1/chat/completions',
    zhipu: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    deepseek: 'https://api.deepseek.com/v1/chat/completions'
  }
  return urls[provider] || ''
}

export const aiChatService = new AIChatService()
