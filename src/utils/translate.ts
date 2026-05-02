// 免费翻译工具 — 使用 MyMemory API
// https://mymemory.translated.net/doc/spec.php

const API_URL = 'https://api.mymemory.translated.net/get'

// 检测文本是否主要是中文
export function isChinese(text: string): boolean {
  const chineseChars = text.match(/[一-鿿]/g)
  return chineseChars ? chineseChars.length / text.length > 0.3 : false
}

// 批量翻译（用 | 分隔）
export async function translateBatch(
  texts: string[],
  from = 'en',
  to = 'zh-CN'
): Promise<Map<number, string>> {
  const result = new Map<number, string>()

  // 过滤掉已经是中文的和空的
  const toTranslate: { index: number; text: string }[] = []
  texts.forEach((text, index) => {
    if (!text || isChinese(text)) {
      result.set(index, text || '')
    } else {
      toTranslate.push({ index, text })
    }
  })

  if (toTranslate.length === 0) return result

  // MyMemory 有字符限制，分批（每批最多 5 条）
  const BATCH_SIZE = 5
  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE)
    const joined = batch.map(item => item.text).join('|')

    try {
      const url = `${API_URL}?q=${encodeURIComponent(joined)}&langpair=${from}|${to}`
      const response = await fetch(url)

      if (!response.ok) {
        // 静默失败，保留原文
        batch.forEach(item => result.set(item.index, item.text))
        continue
      }

      const data = await response.json()

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translated = data.responseData.translatedText
        // MyMemory 用 | 分隔返回翻译结果
        const parts = translated.split('|')
        batch.forEach((item, idx) => {
          result.set(item.index, parts[idx]?.trim() || item.text)
        })
      } else {
        // 翻译失败，保留原文
        batch.forEach(item => result.set(item.index, item.text))
      }
    } catch {
      // 网络错误，保留原文
      batch.forEach(item => result.set(item.index, item.text))
    }

    // 批次间延迟
    if (i + BATCH_SIZE < toTranslate.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  return result
}
