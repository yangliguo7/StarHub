// AI 配置
export interface AIConfig {
  provider: 'openai' | 'claude' | 'qwen' | 'zhipu' | 'deepseek' | 'cloudflare'
  apiKey: string
  baseURL?: string
  model?: string
  batchSize?: number // 分类批次大小，默认 50
}

// 默认配置
export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'cloudflare',  // 默认使用 Cloudflare（免费）
  apiKey: '',
  baseURL: '',
  model: '',  // 空则使用各平台默认模型
  batchSize: 50
}

// 各平台默认模型
export const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  claude: 'claude-3-5-sonnet-20241022',
  qwen: 'qwen-plus',
  zhipu: 'glm-4-flash',
  deepseek: 'deepseek-chat',
  cloudflare: '@cf/meta/llama-3.3-70b-instruct-fp8-fast'  // 最适合语义理解
}

// Cloudflare 可用模型列表（用于设置页选择）
export const CLOUDFLARE_MODELS = [
  { value: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', label: 'Llama 3.3 70B（推荐，最强语义理解）' },
  { value: '@cf/meta/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B（新一代）' },
  { value: '@cf/qwen/qwen2.5-coder-32b-instruct', label: 'Qwen 2.5 Coder 32B（代码理解强）' },
  { value: '@cf/qwen/qwen3-30b-a3b-fp8', label: 'Qwen 3 30B（中文优秀）' },
  { value: '@cf/mistralai/mistral-small-3.1-24b-instruct', label: 'Mistral Small 3.1 24B（多语言）' },
  { value: '@cf/meta/llama-3.1-8b-instruct-awq', label: 'Llama 3.1 8B（轻量快速）' },
  { value: '@cf/meta/llama-3-8b-instruct', label: 'Llama 3 8B（最轻量）' },
]

// 各平台默认 API 地址
export const DEFAULT_BASE_URLS = {
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com/v1',
  qwen: 'https://dashscope.aliyun.com/compatible-mode/v1',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  deepseek: 'https://api.deepseek.com/v1',
  cloudflare: '' // 动态构建
}

// 从 localStorage 获取 AI 配置
export function getAIConfig(): AIConfig {
  const stored = localStorage.getItem('ai_config')
  if (stored) {
    try {
      const config = JSON.parse(stored)
      // 确保 batchSize 有默认值
      if (!config.batchSize) {
        config.batchSize = DEFAULT_AI_CONFIG.batchSize
      }
      return config
    } catch (e) {
      console.error('Failed to parse AI config:', e)
    }
  }
  return DEFAULT_AI_CONFIG
}

// 保存 AI 配置到 localStorage
export function saveAIConfig(config: AIConfig): void {
  localStorage.setItem('ai_config', JSON.stringify(config))
}

// 检查 AI 配置是否完整
export function isAIConfigured(): boolean {
  const config = getAIConfig()
  return !!config.provider  // Cloudflare 不需要 API key
}

// 获取当前有效的模型（AI 对话和分类共用）
export function getEffectiveModel(): string {
  const config = getAIConfig()
  if (config.model) return config.model
  return DEFAULT_MODELS[config.provider] || DEFAULT_MODELS.cloudflare
}
