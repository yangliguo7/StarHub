export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export class AIChatService {
  private model: string
  
  constructor(model = '@cf/meta/llama-3-8b-instruct') {
    this.model = model
  }
  
  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: this.model
      })
    })
    
    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`)
    }
    
    const data = await response.json()
    return data.response || data.choices?.[0]?.message?.content || ''
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
    
    // 提取关键词（移除语言和数字后的内容）
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

export const aiChatService = new AIChatService()
