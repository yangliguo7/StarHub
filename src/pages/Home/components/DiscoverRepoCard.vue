<template>
  <div class="discover-repo-card" @click="$emit('click')">
    <div class="card-header">
      <a :href="repo.html_url" target="_blank" class="repo-link" @click.stop>
        <span class="repo-owner">{{ repo.owner.login }}</span> /
        <span class="repo-name">{{ repo.name }}</span>
      </a>
      <div class="repo-stats">
        <span class="stat-item">
          <el-icon class="stat-icon star-icon"><Star /></el-icon>
          {{ formatNumber(repo.stargazers_count) }}
        </span>
        <span class="stat-item">
          <el-icon class="stat-icon"><ForkSpoon /></el-icon>
          {{ formatNumber(repo.forks_count) }}
        </span>
      </div>
    </div>

    <!-- AI 分析结果 -->
    <div v-if="analysis" class="card-analysis">
      <p class="ai-summary">{{ analysis.summary }}</p>
      <p class="ai-use-case">
        <el-icon><User /></el-icon>
        {{ analysis.useCase }}
      </p>
    </div>

    <!-- 无 AI 分析时显示原始描述 -->
    <p v-else-if="repo.description" class="repo-description">
      {{ repo.description }}
    </p>

    <!-- AI 分析加载中 -->
    <div v-else class="ai-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>AI 分析中...</span>
    </div>

    <div class="card-footer">
      <div class="card-tags">
        <span v-if="repo.language" class="lang-tag">
          <span class="lang-dot" :style="{ backgroundColor: getLanguageColor(repo.language) }"></span>
          {{ repo.language }}
        </span>
        <span v-for="tag in displayTags" :key="tag" class="ai-tag">{{ tag }}</span>
      </div>
      <a
        v-if="analysis?.officialUrl"
        :href="analysis.officialUrl"
        target="_blank"
        class="official-link"
        @click.stop
      >
        <el-icon><Link /></el-icon>
        官网
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star, ForkSpoon, User, Loading, Link } from '@element-plus/icons-vue'
import { getLanguageColor } from '@/utils/languageColors'
import { formatNumber } from '@/utils'
import type { Repository } from '@/types'
import type { RepoAnalysis } from '@/services/ai'

const props = defineProps<{
  repo: Repository
  analysis?: RepoAnalysis | null
}>()

defineEmits<{
  click: []
}>()

const displayTags = computed(() => {
  if (!props.analysis?.tags) return []
  return props.analysis.tags.slice(0, 4)
})
</script>

<style lang="scss" scoped>
.discover-repo-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--border);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  [data-theme='dark'] & {
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.repo-link {
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--text-primary);
  transition: color 0.2s;

  &:hover {
    color: var(--el-color-primary);
  }

  .repo-owner {
    color: var(--text-secondary);
  }
}

.repo-stats {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;
  color: var(--text-secondary);

  .stat-icon {
    font-size: 14px;
  }

  .star-icon {
    color: #fbbf24;
  }
}

.card-analysis {
  margin-bottom: 10px;

  .ai-summary {
    margin: 0 0 6px;
    font-size: 0.875rem;
    color: var(--text-primary);
    line-height: 1.6;
  }

  .ai-use-case {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;

    .el-icon {
      color: var(--el-color-primary);
      font-size: 13px;
    }
  }
}

.repo-description {
  margin: 0 0 10px;
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ai-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 0.8125rem;
  color: var(--text-tertiary);

  .el-icon {
    color: var(--el-color-primary);
  }
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}

.lang-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.lang-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ai-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.6875rem;
  background: var(--el-fill-color-light);
  color: var(--text-secondary);

  [data-theme='dark'] & {
    background: rgba(96, 165, 250, 0.1);
    color: #93c5fd;
  }
}

.official-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.75rem;
  color: var(--el-color-primary);
  text-decoration: none;
  flex-shrink: 0;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
}
</style>
