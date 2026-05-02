import { defineStore } from 'pinia'
import { githubApi } from '@/api/github'
import type { Repository, TrendingPeriod } from '@/types'

interface CacheEntry {
  data: Repository[]
  timestamp: number
}

export const useDiscoverStore = defineStore('discover', {
  state: () => ({
    repos: [] as Repository[],
    // 翻译相关
    translations: new Map<number, string>(), // repoId -> 翻译文本
    translateEnabled: localStorage.getItem('discover_translate') === 'true',
    translating: false,
    // 其他状态
    loading: false,
    period: 'daily' as TrendingPeriod,
    language: '',
    page: 1,
    totalCount: 0,
    hasMore: true,
    cache: new Map<string, CacheEntry>()
  }),

  actions: {
    async fetchTrending() {
      const cacheKey = `${this.period}_${this.language}`
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
        this.repos = cached.data
        this.page = 1
        this.hasMore = this.repos.length < this.totalCount
        if (this.translateEnabled) this.translateCurrentRepos()
        return
      }

      this.loading = true
      try {
        const response = await githubApi.searchTrendingRepositories(
          this.period,
          this.language,
          20,
          1
        )
        this.repos = response.data.items
        this.totalCount = response.data.total_count
        this.page = 1
        this.hasMore = this.repos.length < this.totalCount

        this.cache.set(cacheKey, {
          data: this.repos,
          timestamp: Date.now()
        })

        if (this.translateEnabled) this.translateCurrentRepos()
      } catch (error) {
        console.error('Failed to fetch trending repos:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async translateCurrentRepos() {
      if (this.repos.length === 0 || this.translating) return

      // 只翻译还没翻译的
      const untranslated = this.repos.filter(r => !this.translations.has(r.id))
      if (untranslated.length === 0) return

      this.translating = true
      try {
        const { translateBatch } = await import('@/utils/translate')
        const texts = untranslated.map(r => r.description || '')
        const results = await translateBatch(texts)

        results.forEach((translated, index) => {
          const repo = untranslated[index]
          if (repo && translated) {
            this.translations.set(repo.id, translated)
          }
        })
      } catch (error) {
        console.error('Translation failed:', error)
      } finally {
        this.translating = false
      }
    },

    setTranslateEnabled(enabled: boolean) {
      this.translateEnabled = enabled
      localStorage.setItem('discover_translate', String(enabled))
      if (enabled) {
        this.translateCurrentRepos()
      }
    },

    async loadMore() {
      if (this.loading || !this.hasMore) return

      this.loading = true
      try {
        this.page++
        const response = await githubApi.searchTrendingRepositories(
          this.period,
          this.language,
          20,
          this.page
        )
        this.repos.push(...response.data.items)
        this.hasMore = this.repos.length < this.totalCount

        if (this.translateEnabled) this.translateCurrentRepos()
      } catch (error) {
        console.error('Failed to load more repos:', error)
        this.page--
        throw error
      } finally {
        this.loading = false
      }
    },

    setPeriod(period: TrendingPeriod) {
      this.period = period
      this.translations.clear()
      this.fetchTrending()
    },

    setLanguage(language: string) {
      this.language = language
      this.page = 1
      this.translations.clear()
      this.fetchTrending()
    }
  }
})
