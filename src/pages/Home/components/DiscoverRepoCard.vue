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

    <!-- 翻译模式：显示翻译 + 原文 -->
    <div v-if="translation" class="card-translation">
      <p class="translated-text">{{ translation }}</p>
      <p v-if="repo.description" class="original-text">{{ repo.description }}</p>
    </div>

    <!-- 普通模式：显示原始描述 -->
    <p v-else-if="repo.description" class="repo-description">
      {{ repo.description }}
    </p>

    <div class="card-footer">
      <div class="card-tags">
        <span v-if="repo.language" class="lang-tag">
          <span class="lang-dot" :style="{ backgroundColor: getLanguageColor(repo.language) }"></span>
          {{ repo.language }}
        </span>
        <span v-for="tag in displayTags" :key="tag" class="topic-tag">{{ tag }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star, ForkSpoon } from '@element-plus/icons-vue'
import { getLanguageColor } from '@/utils/languageColors'
import { formatNumber } from '@/utils'
import type { Repository } from '@/types'

const props = defineProps<{
  repo: Repository
  translation?: string | null
}>()

defineEmits<{
  click: []
}>()

const displayTags = computed(() => {
  return (props.repo.topics || []).slice(0, 4)
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

.card-translation {
  margin-bottom: 10px;

  .translated-text {
    margin: 0 0 4px;
    font-size: 0.875rem;
    color: var(--text-primary);
    line-height: 1.6;
  }

  .original-text {
    margin: 0;
    font-size: 0.75rem;
    color: var(--text-tertiary);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
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

.topic-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.6875rem;
  background: var(--el-fill-color-light);
  color: var(--text-secondary);

  [data-theme='dark'] & {
    background: rgba(124, 140, 248, 0.1);
    color: #93c5fd;
  }
}
</style>
