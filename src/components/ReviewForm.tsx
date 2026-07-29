import { useState } from 'react'
import RatingStars from './RatingStars'

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
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div
        className={`px-6 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
          type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
        }`}
      >
        {type === 'success' ? (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        )}
        {message}
      </div>
    </div>
  )
}

/* ===================== 类型定义 ===================== */

interface ReviewFormProps {
  /** 要评价的食堂 ID */
  canteenId: number
  /** 提交成功后的回调，参数为评分和评价内容 */
  onSubmitSuccess?: (rating: number, content: string) => void
}

const MAX_CONTENT_LENGTH = 200
const MIN_CONTENT_LENGTH = 5

/* ===================== 组件 ===================== */

export default function ReviewForm({ canteenId, onSubmitSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [ratingError, setRatingError] = useState('')
  const [contentError, setContentError] = useState('')
  const [touched, setTouched] = useState({ rating: false, content: false })

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  })

  /* ---------- Toast 辅助 ---------- */
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000)
  }

  /* ---------- 验证 ---------- */
  const validateRating = (value: number): string => {
    if (value === 0) return '请给食堂打分'
    return ''
  }

  const validateContent = (value: string): string => {
    const trimmed = value.trim()
    if (!trimmed) return '请输入评价内容'
    if (trimmed.length < MIN_CONTENT_LENGTH) return '评价至少5个字'
    return ''
  }

  /* ---------- 失焦处理 ---------- */
  const handleRatingBlur = () => {
    setTouched((prev) => ({ ...prev, rating: true }))
    setRatingError(validateRating(rating))
  }

  const handleContentBlur = () => {
    setTouched((prev) => ({ ...prev, content: true }))
    setContentError(validateContent(content))
  }

  /* ---------- 提交 ---------- */
  const handleSubmit = async () => {
    // 全量验证
    const errRating = validateRating(rating)
    const errContent = validateContent(content)
    setRatingError(errRating)
    setContentError(errContent)
    setTouched({ rating: true, content: true })

    if (errRating || errContent) return

    setSubmitting(true)
    try {
      const body = {
        canteen_id: canteenId,
        rating,
        content: content.trim(),
      }
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('提交失败')

      const submittedRating = rating
      const submittedContent = content.trim()
      showToast('评价提交成功！', 'success')
      setRating(0)
      setContent('')
      setRatingError('')
      setContentError('')
      setTouched({ rating: false, content: false })
      onSubmitSuccess?.(submittedRating, submittedContent)
    } catch {
      showToast('提交失败，请稍后重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------- 渲染 ---------- */
  return (
    <>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />

      <div className="max-w-[560px] mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {/* 标题 */}
          <h2 className="text-lg font-bold text-gray-800 mb-6">提交食堂评价</h2>

          <div className="space-y-6">
            {/* ============ 评分 ============ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                评分 <span className="text-red-500">*</span>
              </label>
              <div
                className={`p-4 rounded-lg border-2 transition ${
                  touched.rating && ratingError
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-amber-200 bg-amber-50/50'
                }`}
                onBlur={handleRatingBlur}
                tabIndex={-1}
              >
                <div className="flex items-center gap-4">
                  <RatingStars
                    rating={rating}
                    onChange={(val) => {
                      setRating(val)
                      if (touched.rating) setRatingError(validateRating(val))
                    }}
                  />
                  <span className="text-lg font-bold text-amber-500 min-w-[2ch] text-center">
                    {rating || 0}
                  </span>
                  <span className="text-sm text-gray-400">分</span>
                </div>
              </div>
              {touched.rating && ratingError && (
                <p className="mt-1.5 text-xs text-red-500">{ratingError}</p>
              )}
            </div>

            {/* ============ 评价内容 ============ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                评价内容 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    if (touched.content) setContentError(validateContent(e.target.value))
                  }}
                  onBlur={handleContentBlur}
                  placeholder="说说你的用餐体验..."
                  rows={5}
                  maxLength={MAX_CONTENT_LENGTH}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none ${
                    touched.content && contentError ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                <span className="absolute bottom-2.5 right-3 text-xs text-gray-400">
                  {content.length}/{MAX_CONTENT_LENGTH}
                </span>
              </div>
              {touched.content && contentError && (
                <p className="mt-1.5 text-xs text-red-500">{contentError}</p>
              )}
            </div>
          </div>

          {/* ============ 提交按钮 ============ */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full py-2.5 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 ${
                submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
              }`}
            >
              {submitting && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {submitting ? '提交中...' : '提交评价'}
            </button>
          </div>
        </div>
      </div>

      {/* 动画 keyframes */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}