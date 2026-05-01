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
      // 检查缓存（30分钟有效）
      const cacheKey = `${this.period}_${this.language}`
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
        this.repos = cached.data
        this.page = 1
        this.hasMore = this.repos.length < this.totalCount
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

        // 更新缓存
        this.cache.set(cacheKey, {
          data: this.repos,
          timestamp: Date.now()
        })
      } catch (error) {
        console.error('Failed to fetch trending repos:', error)
        throw error
      } finally {
        this.loading = false
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
      this.fetchTrending()
    },

    setLanguage(language: string) {
      this.language = language
      this.page = 1
      this.fetchTrending()
    }
  }
})
