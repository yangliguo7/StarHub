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

        <!-- 翻译开关 -->
        <div class="translate-toggle">
          <el-icon><Sunrise /></el-icon>
          <el-switch
            v-model="translateEnabled"
            @change="handleTranslateChange"
            size="small"
          />
          <span class="translate-label">翻译</span>
        </div>
      </div>
    </div>

    <!-- 翻译状态 -->
    <div v-if="translating" class="translate-status">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>正在翻译...</span>
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
          :translation="translateEnabled ? (translations.get(repo.id) || null) : null"
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
import { Loading, Sunrise } from '@element-plus/icons-vue'
import type { Repository, TrendingPeriod } from '@/types'

const emit = defineEmits<{
  'repo-click': [repo: Repository]
}>()

const store = useDiscoverStore()
const { repos, loading, hasMore, translations, translateEnabled, translating } = storeToRefs(store)

const currentPeriod = ref<TrendingPeriod>('daily')
const currentLanguage = ref('')
const loadingMore = ref(false)

const handlePeriodChange = (period: TrendingPeriod) => {
  store.period = period
  store.fetchTrending()
}

watch(currentLanguage, (lang) => {
  store.language = lang
  store.page = 1
  store.fetchTrending()
})

const handleTranslateChange = (enabled: boolean) => {
  store.setTranslateEnabled(enabled)
}

const loadMore = async () => {
  loadingMore.value = true
  try {
    await store.loadMore()
  } finally {
    loadingMore.value = false
  }
}

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

.translate-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;
  color: var(--text-secondary);

  .el-icon {
    color: #f59e0b;
    font-size: 14px;
  }
}

.translate-label {
  user-select: none;
}

.translate-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-size: 0.8125rem;
  color: var(--text-secondary);
  flex-shrink: 0;

  .el-icon {
    color: #f59e0b;
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
