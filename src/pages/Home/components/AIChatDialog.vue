<template>
  <div class="ai-chat-dialog">
    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef">
      <div 
        v-for="(msg, index) in messages" 
        :key="index"
        :class="['message', msg.role]"
      >
        <div class="message-avatar">
          <span v-if="msg.role === 'assistant'">🤖</span>
          <span v-else>👤</span>
        </div>
        <div class="message-content">
          <div class="message-text" v-html="formatMessage(msg.content)" />
          
          <!-- AI 推荐的项目 -->
          <div v-if="msg.role === 'assistant' && msg.repos?.length" class="recommended-repos">
            <div 
              v-for="repo in msg.repos" 
              :key="repo.id"
              class="recommended-repo"
              @click="$emit('repo-click', repo)"
            >
              <div class="repo-header">
                <span class="repo-name">{{ repo.full_name }}</span>
                <span class="repo-stars">⭐ {{ formatStars(repo.stargazers_count) }}</span>
              </div>
              <div class="repo-desc" v-if="repo.description">
                {{ repo.description }}
              </div>
              <div class="repo-meta">
                <span v-if="repo.language" class="repo-lang">{{ repo.language }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="sending" class="message assistant">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 输入框 -->
    <div class="chat-input">
      <el-input
        v-model="inputMessage"
        placeholder="描述你想找的项目，例如：推荐几个 Star 增长快的 AI 项目"
        @keyup.enter="sendMessage"
        :disabled="sending"
        size="large"
      >
        <template #append>
          <el-button 
            @click="sendMessage" 
            :loading="sending"
            type="primary"
            :disabled="!inputMessage.trim()"
          >
            发送
          </el-button>
        </template>
      </el-input>
      
      <!-- 快捷按钮 -->
      <div class="quick-actions">
        <el-button size="small" @click="quickSearch('本周最火的 AI 项目')">
          🔥 本周 AI 热门
        </el-button>
        <el-button size="small" @click="quickSearch('推荐一些实用的开发工具')">
          🛠️ 开发工具
        </el-button>
        <el-button size="small" @click="quickSearch('适合新手的开源项目')">
          🌱 新手友好
        </el-button>
        <el-button size="small" @click="quickSearch('推荐一些 Rust 项目')">
          🦀 Rust 项目
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { aiChatService } from '@/services/ai-chat'
import { githubApi } from '@/api/github'
import type { Repository } from '@/types'

const emit = defineEmits<{
  'repo-click': [repo: Repository]
}>()

interface Message {
  role: 'user' | 'assistant'
  content: string
  repos?: Repository[]
}

const messages = ref<Message[]>([])
const inputMessage = ref('')
const sending = ref(false)
const messageListRef = ref<HTMLElement>()

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || sending.value) return
  
  const userMessage = inputMessage.value.trim()
  messages.value.push({ role: 'user', content: userMessage })
  inputMessage.value = ''
  
  await nextTick()
  scrollToBottom()
  
  sending.value = true
  
  try {
    // 1. 解析用户意图
    const intent = aiChatService.parseSearchIntent(userMessage)
    
    // 2. 如果有明确的搜索条件，直接搜索
    if (intent.query || intent.language) {
      const searchResult = await githubApi.searchTrendingRepositories(
        'weekly',
        intent.language,
        5
      )
      
      const repos = searchResult.data.items
      
      // 3. 让 AI 基于搜索结果生成推荐
      if (repos.length > 0) {
        const context = repos
          .map(r => `- ${r.full_name}: ${r.description || '无描述'} (${r.stargazers_count} Stars)`)
          .join('\n')
        
        const response = await aiChatService.chat([
          { role: 'system', content: aiChatService.getSystemPrompt() },
          { role: 'user', content: userMessage },
          { role: 'assistant', content: `以下是搜索结果：\n${context}\n\n请基于这些结果回复用户。` }
        ])
        
        messages.value.push({
          role: 'assistant',
          content: response,
          repos: repos.slice(0, 3)
        })
      } else {
        messages.value.push({
          role: 'assistant',
          content: '没有找到匹配的项目，试试其他关键词？'
        })
      }
    } else {
      // 4. 纯对话，让 AI 推荐
      const response = await aiChatService.chat([
        { role: 'system', content: aiChatService.getSystemPrompt() },
        { role: 'user', content: userMessage }
      ])
      
      messages.value.push({ role: 'assistant', content: response })
    }
  } catch (error) {
    console.error('AI chat error:', error)
    messages.value.push({
      role: 'assistant',
      content: '抱歉，处理您的请求时出错了，请稍后重试。'
    })
  } finally {
    sending.value = false
    await nextTick()
    scrollToBottom()
  }
}

// 快捷搜索
const quickSearch = (query: string) => {
  inputMessage.value = query
  sendMessage()
}

// 格式化消息
const formatMessage = (content: string) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// 格式化 star 数量
const formatStars = (count: number) => {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count.toString()
}

const scrollToBottom = () => {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

onMounted(() => {
  // 欢迎消息
  messages.value.push({
    role: 'assistant',
    content: '👋 你好！我是 StarHub AI 助手。\n\n你可以：\n- 描述你想要的项目类型\n- 让我推荐热门开源项目\n- 用自然语言搜索 GitHub\n\n例如：「推荐几个 Star 增长快的 AI 项目」'
  })
})
</script>

<style scoped>
.ai-chat-dialog {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.message-content {
  background: var(--el-fill-color-light);
  border-radius: 12px;
  padding: 12px 16px;
}

.message.user .message-content {
  background: var(--el-color-primary);
  color: white;
}

.message-text {
  line-height: 1.6;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.recommended-repos {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recommended-repo {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.recommended-repo:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recommended-repo .repo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.recommended-repo .repo-name {
  font-weight: 600;
  color: var(--el-color-primary);
}

.recommended-repo .repo-stars {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.recommended-repo .repo-desc {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recommended-repo .repo-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: var(--el-text-color-secondary);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.chat-input {
  padding: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.quick-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  margin-left: 0;
}
</style>
