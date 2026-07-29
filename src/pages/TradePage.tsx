import { useState, useEffect, useRef } from 'react'
import { apiRequest } from '../config/api'
import PostItemForm from '../components/PostItemForm'
import RatingStars from '../components/RatingStars'

const categories = ['全部', '教材', '电子', '生活', '其他']

/* ===================== Toast 组件 ===================== */
function Toast({
  message,
  visible,
  type,
  onClose,
}: {
  message: string
  visible: boolean
  type: 'success' | 'error'
  onClose: () => void
}) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  if (!visible) return null
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-fade-in">
      <div className={`px-6 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
        type === 'error' ? 'bg-red-500' : 'bg-emerald-600'
      }`}>
        {type === 'error' ? (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
        {message}
      </div>
    </div>
  )
}

/* ===================== Modal 组件 ===================== */
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 pb-10">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-[680px] mx-4 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-modal-enter">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {children}
      </div>
    </div>
  )
}

/* ===================== AI 总结弹窗组件 ===================== */
function AiSummaryModal({
  open,
  onClose,
  summary,
}: {
  open: boolean
  onClose: () => void
  summary: string
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-base font-bold text-gray-800 mb-4">📊 AI评价总结</h3>
        <div className="space-y-2">
          {summary.split('\n').filter(Boolean).map((line, idx) => (
            <p key={idx} className="text-sm text-gray-700 leading-relaxed">{line}</p>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">由AI生成，仅供参考</p>
      </div>
    </Modal>
  )
}

/* ===================== 后端返回的 Item 格式 ===================== */
interface ApiItem {
  id: number
  title: string
  price: number
  category: string
  images: string[]
  seller: string
  seller_name?: string
  status: string
  description: string
  contact: string
  created_at: string
}

/* ===================== 评价类型 ===================== */
interface ReviewItem {
  id: number
  item_id?: number
  canteen_id?: number
  username: string
  content: string
  rating: number
  time: string
}

/* ===================== 页面主体 ===================== */

export default function TradePage() {
  const [items, setItems] = useState<ApiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // 搜索与筛选
  const [searchText, setSearchText] = useState('')
  const [activeCategory, setActiveCategory] = useState('全部')

  // 收藏
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [animatingId, setAnimatingId] = useState<number | null>(null)

  // 展开详情
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // 评价列表（按商品 ID 分组）
  const [reviewsMap, setReviewsMap] = useState<Record<number, ReviewItem[]>>({})
  const [reviewsLoading, setReviewsLoading] = useState<Record<number, boolean>>({})

  // AI 评价总结
  const [aiSummaries, setAiSummaries] = useState<Record<number, string>>({})
  const [aiLoading, setAiLoading] = useState<Record<number, boolean>>({})
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiModalSummary, setAiModalSummary] = useState('')

  // 发布商品弹窗
  const [showModal, setShowModal] = useState(false)

  // Toast（支持 success 和 error 两种类型）
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // 搜索防抖
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg)
    setToastType(type)
  }
  const hideToast = () => setToastMsg('')

  // ===================== 数据获取 =====================

  const fetchItems = async (keyword: string, category: string) => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams()
      if (keyword) params.set('keyword', keyword)
      if (category && category !== '全部') params.set('category', category)

      const query = params.toString()
      const res = await apiRequest<{ items: ApiItem[] }>({
        url: `/api/items${query ? '?' + query : ''}`,
      })
      if (res.code === 200) {
        setItems(res.data.items)
      } else {
        throw new Error(res.message)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // 获取某商品的评价
  const fetchReviews = async (itemId: number) => {
    setReviewsLoading((prev) => ({ ...prev, [itemId]: true }))
    try {
      const res = await apiRequest<{ reviews: ReviewItem[] }>({
        url: `/api/reviews?item_id=${itemId}`,
      })
      if (res.code === 200) {
        setReviewsMap((prev) => ({ ...prev, [itemId]: res.data.reviews }))
      }
    } catch {
      // 静默处理
    } finally {
      setReviewsLoading((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  // 获取 AI 评价总结（弹窗展示）
  const fetchAiSummary = async (itemId: number) => {
    // 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('请先登录', 'error')
      return
    }

    // 如有缓存直接展示
    if (aiSummaries[itemId]) {
      setAiModalSummary(aiSummaries[itemId])
      setAiModalOpen(true)
      return
    }

    setAiLoading((prev) => ({ ...prev, [itemId]: true }))
    try {
      const res = await apiRequest<{ summary: string }>({
        url: '/api/ai/summarize-reviews',
        method: 'POST',
        body: { item_id: itemId },
      })
      if (res.code === 200) {
        setAiSummaries((prev) => ({ ...prev, [itemId]: res.data.summary }))
        setAiModalSummary(res.data.summary)
        setAiModalOpen(true)
      } else {
        showToast('AI总结失败，请稍后重试', 'error')
      }
    } catch {
      showToast('AI总结失败，请稍后重试', 'error')
    } finally {
      setAiLoading((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  // ===================== 初始化与搜索 =====================

  // 初始加载
  useEffect(() => {
    fetchItems('', '全部')
  }, [])

  // 搜索防抖：停止输入 400ms 后发起请求
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchItems(searchText, activeCategory)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText])

  // 切换分类立即发起请求
  useEffect(() => {
    fetchItems(searchText, activeCategory)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory])

  // ===================== 交互 =====================

  // 切换收藏
  const toggleFavorite = (id: number) => {
    setAnimatingId(id)
    setTimeout(() => setAnimatingId(null), 300)

    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // 展开/收起卡片详情
  const toggleExpand = (id: number) => {
    const next = expandedId === id ? null : id
    setExpandedId(next)
    // 展开时若未加载过评价，则获取
    if (next !== null && !reviewsMap[next]) {
      fetchReviews(next)
    }
  }

  // 评价提交成功 → 刷新评价列表
  const handleReviewSuccess = (itemId: number) => {
    return () => {
      fetchReviews(itemId)
      showToast('评价成功！', 'success')
    }
  }

  // 发布成功回调
  const handlePostSuccess = () => {
    setShowModal(false)
    showToast('商品发布成功！', 'success')
    fetchItems(searchText, activeCategory)
  }

  // ===================== 骨架屏 =====================
  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-emerald-950 mb-6">二手交易</h1>

        {/* 搜索框占位 */}
        <div className="w-full max-w-md h-10 bg-gray-200 rounded-lg animate-pulse mb-4" />

        {/* 分类标签占位 */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-16 h-8 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>

        {/* 卡片骨架屏 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-40 bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="flex items-center justify-between">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
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
        <h1 className="text-2xl font-bold text-emerald-950 mb-6">二手交易</h1>
        <div className="max-w-md mx-auto mt-12 bg-white rounded-xl shadow-sm border border-red-100 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-5">加载失败，请检查网络连接</p>
          <button
            onClick={() => fetchItems(searchText, activeCategory)}
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
    <>
      {/* Toast */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]">
        <Toast message={toastMsg} type={toastType} visible={toastMsg !== ''} onClose={hideToast} />
      </div>

      <div>
        {/* 标题栏 + 发布商品按钮 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-emerald-950">二手交易</h1>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-[0.97] transition-all duration-200 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            发布商品
          </button>
        </div>

        {/* 搜索框 */}
        <input
          type="text"
          placeholder="搜索商品名称或描述"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition mb-4"
        />

        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                activeCategory === cat
                  ? 'bg-emerald-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 商品列表 */}
        {items.length === 0 ? (
          <p className="text-gray-400 text-center py-12">没有匹配的商品</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item: ApiItem) => {
              const isFav = favorites.has(item.id)
              const isAnimating = animatingId === item.id
              const hasImage = item.images && item.images.length > 0 && item.images[0]
              const isExpanded = expandedId === item.id
              const itemReviews = reviewsMap[item.id] ?? []
              const isReviewsLoading = reviewsLoading[item.id]
              const isAiLoading = aiLoading[item.id]

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 relative"
                >
                  {/* 商品卡片主体（点击展开/收起） */}
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleExpand(item.id)}
                  >
                    {/* 收藏按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(item.id)
                      }}
                      className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm transition-transform duration-200 hover:scale-110 ${
                        isAnimating ? 'scale-125' : 'scale-100'
                      }`}
                    >
                      <span className={`text-lg leading-none transition-colors duration-200 ${
                        isFav ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {isFav ? '❤' : '♡'}
                      </span>
                    </button>

                    {/* 商品图 */}
                    <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {hasImage ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-300">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* 商品信息 */}
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-emerald-700">
                          ¥{item.price.toFixed(2)}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">卖家：{item.seller}</p>
                    </div>
                  </div>

                  {/* ===== 展开区域：商品详情 + 评价 + AI总结 ===== */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-4">
                      {/* 商品详情 */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">商品详情</h4>
                        <p className="text-sm text-gray-600">{item.description || '暂无描述'}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>发布时间：{item.created_at}</span>
                          <span>状态：{item.status}</span>
                        </div>
                      </div>

                      {/* AI 评价总结按钮 */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); fetchAiSummary(item.id) }}
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
                            '🤖 AI总结评价'
                          )}
                        </button>
                        {!isAiLoading && !aiSummaries[item.id] && (
                          <span className="text-xs text-gray-400">点击让AI分析用户评价</span>
                        )}
                      </div>

                      {/* 评价表单 */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">发表评价</h4>
                        <ItemReviewForm
                          itemId={item.id}
                          onSubmitSuccess={handleReviewSuccess(item.id)}
                        />
                      </div>

                      {/* 评价列表 */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          用户评价（{itemReviews.length}）
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
                        ) : itemReviews.length === 0 ? (
                          <p className="text-xs text-gray-400">暂无评价</p>
                        ) : (
                          <div className="space-y-3">
                            {itemReviews.map((r) => (
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

      {/* ===================== AI 总结弹窗 ===================== */}
      <AiSummaryModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        summary={aiModalSummary}
      />

      {/* ===================== 发布商品弹窗 ===================== */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <PostItemForm
          onSuccess={handlePostSuccess}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {/* 动画 keyframes */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        @keyframes modal-enter {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modal-enter {
          animation: modal-enter 0.25s ease-out;
        }
      `}</style>
    </>
  )
}

/* ===================== 商品评价表单组件 ===================== */
function ItemReviewForm({
  itemId,
  onSubmitSuccess,
}: {
  itemId: number
  onSubmitSuccess: () => void
}) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (rating === 0) {
      setError('请选择评分')
      return
    }
    if (!content.trim()) {
      setError('请输入评价内容')
      return
    }
    if (content.trim().length < 5) {
      setError('评价内容至少5个字')
      return
    }

    setSubmitting(true)
    try {
      const res = await apiRequest({
        url: '/api/reviews',
        method: 'POST',
        body: { item_id: itemId, content: content.trim(), rating },
      })
      if (res.code === 201) {
        setRating(0)
        setContent('')
        onSubmitSuccess()
      } else {
        setError(res.message || '提交失败')
      }
    } catch {
      setError('提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100">
      {/* 星级评分 */}
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-xl leading-none transition-transform hover:scale-110 focus:outline-none"
          >
            <span className={star <= (hoverRating || rating) ? 'text-amber-400' : 'text-gray-200'}>
              ★
            </span>
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-1">
          {rating > 0 ? `${rating}分` : '点击评分'}
        </span>
      </div>

      {/* 文本输入 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="说说你对这个商品的看法（5-200字）"
        rows={2}
        maxLength={200}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none mb-2"
      />

      {/* 错误提示 */}
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {/* 提交按钮 */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
      >
        {submitting && (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {submitting ? '提交中...' : '提交评价'}
      </button>
    </div>
  )
}