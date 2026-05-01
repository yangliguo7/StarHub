import http from './request'
import qs from 'query-string'
import type { AxiosResponse } from 'axios'
import type { User, Repository } from '@/types'

export const githubApi = {
  // Get authenticated user
  getLoginUser(): Promise<AxiosResponse<User>> {
    return http.get('/user')
  },

  // Get user by username
  getUser(userName: string): Promise<AxiosResponse<User>> {
    return http.get(`/users/${userName}`)
  },

  // Get starred repositories for authenticated user
  getLoginUserStarred(
    perPage: number = 40,
    page: number = 1
  ): Promise<AxiosResponse<Repository[]>> {
    return http.get(
      `/user/starred?${qs.stringify({ per_page: perPage, page })}`
    )
  },

  // Get starred repositories for a user
  getUserStarred(
    userName: string,
    perPage: number = 40,
    page: number = 1
  ): Promise<AxiosResponse<Repository[]>> {
    return http.get(
      `/users/${userName}/starred?${qs.stringify({ per_page: perPage, page })}`
    )
  },

  // Get repository README
  getReadme(owner: string, repo: string): Promise<AxiosResponse<string>> {
    return http.get(`/repos/${owner}/${repo}/readme`, {
      headers: {
        Accept: 'application/vnd.github.VERSION.raw'
      }
    })
  },

  // Get repository details
  getRepository(owner: string, repo: string): Promise<AxiosResponse<Repository>> {
    return http.get(`/repos/${owner}/${repo}`)
  },

  // 搜索热门仓库
  async searchTrendingRepositories(
    period: 'daily' | 'weekly' | 'monthly',
    language?: string,
    perPage: number = 20,
    page: number = 1
  ): Promise<AxiosResponse<{ items: Repository[], total_count: number }>> {
    const now = new Date()
    const daysMap = { daily: 1, weekly: 7, monthly: 30 }
    const sinceDate = new Date(now.getTime() - daysMap[period] * 86400 * 1000)
      .toISOString().split('T')[0]
    
    let query = `created:>=${sinceDate}`
    if (language) query += ` language:${language}`
    
    return http.get(`/search/repositories?${qs.stringify({
      q: query,
      sort: 'stars',
      order: 'desc',
      per_page: perPage,
      page
    })}`) as any
  }
}