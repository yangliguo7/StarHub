<template>
  <div class="discover-view">
    <!-- 标题栏 -->
    <div class="discover-header">
      <h2 class="discover-title">🔥 热门仓库</h2>
      <div class="discover-controls">
        <!-- 时期切换 -->
        <el-radio-group v-model="currentPeriod" @change="handlePeriodChange" size="small">
          <el-radio-button value="daily">日榜</el-radio-button>
          <el-radio-button value="weekly">周榜</el-radio-button>
          <el-radio-button value="monthly">月榜</el-radio-button>
        </el-radio-group>

        <!-- 语言筛选 -->
        <el-select
          v-model="currentLanguage"
          clearable
          placeholder="所有语言"
          size="small"
          style="width: 120px"
        >
          <el-option label="JavaScript" value="javascript" />
          <el-option label="TypeScript" value="typescript" />
          <el-option label="Python" value="python" />
          <el-option label="Go" value="go" />
          <el-option label="Rust" value="rust" />
          <el-option label="Java" value="java" />
          <el-option label="C++" value="c++" />
          <el-option label="C#" value="csharp" />
          <el-option label="PHP" value="php" />
          <el-option label="Ruby" value="ruby" />
          <el-option label="Swift" value="swift" />
          <el-option label="Kotlin" value="kotlin" />
        </el-select>
      </div>
    </div>

    <!-- AI 分析状态 -->
    <div v-if="analyzing" class="ai-status">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>AI 正在分析仓库信息...</span>
    </div>

    <!-- 仓库列表 -->
    <div class="discover-repos" v-loading="loading">
      <div
        v-for="(repo, index) in repos"
        :key="repo.id"
        class="trending-repo-item"
      >
        <span class="rank-badge" :class="getRankClass(index + 1)">
          #{{ index + 1 }}
        </span>
        <DiscoverRepoCard
          :repo="repo"
          :analysis="analyses.get(repo.id) || null"
          @click="$emit('repo-click', repo)"
        />
      </div>

      <el-empty v-if="!loading && repos.length === 0" description="暂无数据" />
    </div>

    <!-- 加载更多 -->
    <div class="load-more" v-if="hasMore && repos.length > 0">
      <el-button
        @click="loadMore"
        :loading="loadingMore"
        :disabled="loading"
      >
        {{ loadingMore ? '加载中...' : '加载更多' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDiscoverStore } from '@/stores/discover'
import DiscoverRepoCard from './DiscoverRepoCard.vue'
import { Loading } from '@element-plus/icons-vue'
import type { Repository, TrendingPeriod } from '@/types'

const emit = defineEmits<{
  'repo-click': [repo: Repository]
}>()

const store = useDiscoverStore()
const { repos, loading, hasMore, analyses, analyzing } = storeToRefs(store)

const currentPeriod = ref<TrendingPeriod>('daily')
const currentLanguage = ref('')
const loadingMore = ref(false)

// 时期切换
const handlePeriodChange = (period: TrendingPeriod) => {
  store.period = period
  store.fetchTrending()
}

// 语言筛选
watch(currentLanguage, (lang) => {
  store.language = lang
  store.page = 1
  store.fetchTrending()
})

// 加载更多
const loadMore = async () => {
  loadingMore.value = true
  try {
    await store.loadMore()
  } finally {
    loadingMore.value = false
  }
}

// 排名样式
const getRankClass = (rank: number) => {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  return ''
}

onMounted(() => {
  store.fetchTrending()
})
</script>

<style scoped>
.discover-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.discover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.discover-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.discover-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-size: 0.8125rem;
  color: var(--el-color-primary);
  flex-shrink: 0;

  [data-theme='dark'] & {
    background: rgba(96, 165, 250, 0.1);
  }
}

.discover-repos {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.trending-repo-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.rank-badge {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.rank-badge.rank-gold {
  background: linear-gradient(135deg, #ffd700, #ffb700);
  color: #000;
}

.rank-badge.rank-silver {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: #000;
}

.rank-badge.rank-bronze {
  background: linear-gradient(135deg, #cd7f32, #b87333);
  color: #fff;
}

.trending-repo-item :deep(.discover-repo-card) {
  flex: 1;
  min-width: 0;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  flex-shrink: 0;
}

/* 暗色主题适配 */
:root[data-theme="dark"] .rank-badge {
  background: var(--el-fill-color-darker);
}

:root[data-theme="dark"] .rank-badge.rank-gold {
  background: linear-gradient(135deg, #b8860b, #996515);
}

:root[data-theme="dark"] .rank-badge.rank-silver {
  background: linear-gradient(135deg, #808080, #696969);
}

:root[data-theme="dark"] .rank-badge.rank-bronze {
  background: linear-gradient(135deg, #8b4513, #654321);
}
</style>
