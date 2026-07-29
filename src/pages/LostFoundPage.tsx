import { useState, useEffect } from 'react'
import LostFoundForm from '../components/LostFoundForm'
import { apiRequest } from '../config/api'

/** API 返回的失物招领数据 */
interface LostItem {
  id: number
  type: '丢失' | '捡到'
  title: string
  location: string
  time: string
  description: string
  contact: string
  status: '待认领' | '已认领' | '已归还'
}

const tabList = ['全部', '寻物启事', '失物招领']

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

export default function LostFoundPage() {
  const [items, setItems] = useState<LostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [activeTab, setActiveTab] = useState('全部')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)

  /** 获取失物招领数据 */
  const fetchLostItems = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await apiRequest<{ items: LostItem[] }>({ url: '/api/lost-found' })
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

  useEffect(() => {
    fetchLostItems()
  }, [])

  // 筛选
  const filtered = items.filter((item) => {
    if (activeTab === '全部') return true
    if (activeTab === '寻物启事') return item.type === '丢失'
    if (activeTab === '失物招领') return item.type === '捡到'
    return true
  })

  // 发布成功回调
  const handlePostSuccess = () => {
    setShowModal(false)
    fetchLostItems()
  }

  const statusColors: Record<string, string> = {
    '待认领': 'bg-amber-50 text-amber-600',
    '已认领': 'bg-blue-50 text-blue-600',
    '已归还': 'bg-green-50 text-green-600',
  }

  /** 生成纯色占位图（无网络请求） */
  const svgPlaceholder = (text: string, bg = '#f1f5f9', fg = '#94a3b8') =>
    `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">
        <rect width="400" height="200" fill="${bg}"/>
        <text x="200" y="100" text-anchor="middle" dominant-baseline="central"
              font-family="sans-serif" font-size="32" fill="${fg}">${text}</text>
      </svg>`
    )}`

  // ===================== Loading：骨架屏 =====================
  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-emerald-950">失物招领</h1>
          <div className="w-28 h-9 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-20 h-8 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="h-36 bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-14 bg-gray-200 rounded-full animate-pulse" />
                </div>
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ===================== Error：错误状态 =====================
  if (error) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-emerald-950">失物招领</h1>
        </div>

        <div className="max-w-md mx-auto mt-12 bg-white rounded-xl shadow-sm border border-red-100 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-5">加载失败，请检查网络连接</p>
          <button
            onClick={fetchLostItems}
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

  // ===================== Success：正常显示 =====================
  return (
    <>
      <div>
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-emerald-950">失物招领</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 active:scale-95 transition-all duration-200 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14m-7-7h14" />
            </svg>
            发布信息
          </button>
        </div>

        {/* 标签切换 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabList.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 列表 */}
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-12">暂无相关记录</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => {
              const isExpanded = expandedId === item.id
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  {/* 可点击头部 */}
                  <div
                    className="cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    {/* 图片占位 + 类型标签 */}
                    <div className="h-36 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                      <img
                        src={svgPlaceholder(item.type === '丢失' ? '寻物' : '招领', item.type === '丢失' ? '#fef2f2' : '#eff6ff', item.type === '丢失' ? '#ef4444' : '#3b82f6')}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      {/* 丢失/捡到类型标签 —— 不同颜色 */}
                      <span
                        className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.type === '丢失'
                            ? 'bg-red-50 text-red-500 border border-red-200'
                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}
                      >
                        {item.type === '丢失' ? '🧐 寻物' : '🎒 招领'}
                      </span>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[item.status]}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {item.location} · {item.time}
                      </p>
                    </div>
                  </div>

                  {/* 展开详情 */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-2">
                      <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>联系方式：{item.contact}</span>
                      </div>
                      {item.status === '待认领' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            alert(`已提交认领申请，请联系：${item.contact}`)
                          }}
                          className="w-full mt-1 py-1.5 bg-emerald-700 text-white text-xs font-medium rounded-lg hover:bg-emerald-800 active:scale-95 transition-all duration-200"
                        >
                          {item.type === '丢失' ? '我有线索' : '我要认领'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ===================== 发布信息弹窗 ===================== */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <LostFoundForm
          onSuccess={handlePostSuccess}
        />
      </Modal>

      {/* 动画 keyframes */}
      <style>{`
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