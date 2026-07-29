import { useState, useEffect } from 'react'
import { apiRequest } from '../config/api'
import type { Canteen } from '../data/mockData'
import RatingStars from '../components/RatingStars'
import ReviewForm from '../components/ReviewForm'

const tagList = ['全部', '第一食堂', '第二食堂', '第三食堂', '教工食堂']

interface ReviewItem {
  id: number
  canteen_id: number
  username: string
  content: string
  rating: number
  time: string
}

/* ===================== Toast 组件 ===================== */
function Toast({
  message,
  type,
  visible,
}: {
  message: string
  type: 'success' | 'error'
  visible: boolean
}) {
  if (!visible) return null
  const bg = type === 'success' ? 'bg-green-600' : 'bg-red-500'
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div
        className={`${bg} text-white px-5 py-2.5 rounded-lg shadow-lg text-sm font-medium`}
      >
        {message}
      </div>
    </div>
  )
}

export default function CanteenPage() {
  const [canteens, setCanteens] = useState<Canteen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [searchText, setSearchText] = useState('')
  const [activeTag, setActiveTag] = useState('全部')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // 评价列表（按食堂 ID 分组）
  const [reviewsMap, setReviewsMap] = useState<Record<number, ReviewItem[]>>({})
  const [reviewsLoading, setReviewsLoading] = useState<Record<number, boolean>>({})

  // AI 评价总结
  const [aiSummaries, setAiSummaries] = useState<Record<number, string>>({})
  const [aiLoading, setAiLoading] = useState<Record<number, boolean>>({})

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000)
  }

  const fetchCanteens = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await apiRequest<Canteen[]>({ url: '/api/canteens' })
      if (res.code === 200) {
        setCanteens(res.data as Canteen[])
      } else {
        throw new Error(res.message)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCanteens()
  }, [])

  // 获取某食堂的评价
  const fetchReviews = async (canteenId: number) => {
    setReviewsLoading((prev) => ({ ...prev, [canteenId]: true }))
    try {
      const res = await apiRequest<{ reviews: ReviewItem[] }>({
        url: `/api/reviews?canteen_id=${canteenId}`,
      })
      if (res.code === 200) {
        setReviewsMap((prev) => ({ ...prev, [canteenId]: res.data.reviews }))
      }
    } catch {
      // 静默处理
    } finally {
      setReviewsLoading((prev) => ({ ...prev, [canteenId]: false }))
    }
  }

  // 获取 AI 评价总结
  const fetchAiSummary = async (canteenId: number) => {
    // 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('请先登录', 'error')
      return
    }

    // 如果已有缓存，直接使用
    if (aiSummaries[canteenId]) {
      return
    }

    setAiLoading((prev) => ({ ...prev, [canteenId]: true }))
    try {
      const res = await apiRequest<{ summary: string }>({
        url: '/api/ai/summarize-reviews',
        method: 'POST',
        body: { canteen_id: canteenId },
      })
      if (res.code === 200) {
        setAiSummaries((prev) => ({ ...prev, [canteenId]: res.data.summary }))
      } else {
        showToast('AI总结失败，请稍后重试', 'error')
      }
    } catch {
      showToast('AI总结失败，请稍后重试', 'error')
    } finally {
      setAiLoading((prev) => ({ ...prev, [canteenId]: false }))
    }
  }

  // 同时按搜索关键词 + 标签筛选
  const filtered = canteens.filter((c: Canteen) => {
    const matchSearch =
      !searchText ||
      c.name.includes(searchText) ||
      c.location.includes(searchText)
    const matchTag = activeTag === '全部' || c.name === activeTag
    return matchSearch && matchTag
  })

  const toggleExpand = (id: number) => {
    const next = expandedId === id ? null : id
    setExpandedId(next)
    // 展开时若未加载过评价，则获取
    if (next !== null && !reviewsMap[next]) {
      fetchReviews(next)
    }
  }

  // 评价提交成功 → 刷新评价列表
  const handleReviewSuccess = (canteenId: number) => {
    return () => {
      fetchReviews(canteenId)
    }
  }

  // ===================== 骨架屏 =====================
  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-emerald-950 mb-6">食堂资讯</h1>

        {/* 搜索框占位 */}
        <div className="w-full max-w-md h-10 bg-gray-200 rounded-lg animate-pulse mb-4" />

        {/* 标签占位 */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-20 h-8 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>

        {/* 卡片骨架屏 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-40 bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-6 w-14 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-14 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-14 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ===================== 错误状态 =====================
  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-emerald-950 mb-6">食堂资讯</h1>
        <div className="max-w-md mx-auto mt-12 bg-white rounded-xl shadow-sm border border-red-100 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-5">加载失败，请检查网络连接</p>
          <button
            onClick={fetchCanteens}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 active:scale-[0.98] transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            重新加载
          </button>
        </div>
      </div>
    )
  }

  // ===================== 正常显示 =====================
  return (
    <div>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />

      <h1 className="text-2xl font-bold text-emerald-950 mb-6">食堂资讯</h1>

      {/* 搜索框 */}
      <input
        type="text"
        placeholder="搜索食堂名称或位置"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition mb-4"
      />

      {/* 分类标签 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tagList.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
              activeTag === tag
                ? 'bg-emerald-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 食堂卡片列表 */}
      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-12">没有匹配的食堂</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c: Canteen) => {
            const isExpanded = expandedId === c.id
            const canteenReviews = reviewsMap[c.id] ?? []
            const isReviewsLoading = reviewsLoading[c.id]
            const aiSummary = aiSummaries[c.id]
            const isAiLoading = aiLoading[c.id]

            return (
              <div
                key={c.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => toggleExpand(c.id)}
                >
                  <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {c.image ? (
                      <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-gray-300">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                          <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-gray-800">{c.name}</h3>
                      <div className="flex items-center gap-1">
                        <RatingStars rating={Math.round(c.rating)} readonly />
                        <span className="text-sm text-amber-600 font-semibold ml-1">{c.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{c.location}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-5">
                    {/* ===== AI 评价总结 ===== */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <button
                          onClick={() => fetchAiSummary(c.id)}
                          disabled={isAiLoading}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
                        >
                          {isAiLoading ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                              </svg>
                              分析中...
                            </>
                          ) : (
                            '🤖 AI总结'
                          )}
                        </button>
                        {!isAiLoading && !aiSummary && (
                          <span className="text-xs text-gray-400">让AI帮你分析评价</span>
                        )}
                      </div>

                      {/* AI 总结结果卡片 */}
                      {aiSummary && (
                        <div className="bg-white rounded-xl border border-violet-100 p-4 shadow-sm">
                          <h5 className="text-sm font-semibold text-violet-800 mb-3">
                            📊 AI评价总结
                          </h5>
                          <div className="space-y-2">
                            {aiSummary.split('\n').filter(Boolean).map((line, idx) => (
                              <p key={idx} className="text-sm text-gray-700 leading-relaxed">
                                {line}
                              </p>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-3">由AI生成，仅供参考</p>
                        </div>
                      )}
                    </div>

                    {/* 评价表单（放在列表上方） */}
                    <ReviewForm
                      canteenId={c.id}
                      onSubmitSuccess={handleReviewSuccess(c.id)}
                    />

                    {/* 评价列表 */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        用户评价（{canteenReviews.length}）
                      </h4>
                      {isReviewsLoading ? (
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <div key={i} className="bg-white rounded-lg p-3 border border-gray-100 animate-pulse">
                              <div className="h-4 w-1/3 bg-gray-200 rounded mb-2" />
                              <div className="h-3 w-full bg-gray-200 rounded" />
                            </div>
                          ))}
                        </div>
                      ) : canteenReviews.length === 0 ? (
                        <p className="text-xs text-gray-400">暂无评价</p>
                      ) : (
                        <div className="space-y-3">
                          {canteenReviews.map((r) => (
                            <div key={r.id} className="bg-white rounded-lg p-3 border border-gray-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{r.username}</span>
                                <div className="flex items-center gap-1">
                                  <RatingStars rating={r.rating} readonly />
                                  <span className="text-xs text-gray-400 ml-1">{r.time}</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">{r.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}