import { useState } from 'react'

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

interface LostFoundFormProps {
  /** 提交成功后的回调 */
  onSuccess?: () => void
}

interface FormData {
  type: 'lost' | 'found' | ''
  title: string
  location: string
  date: string
  description: string
}

interface FormErrors {
  type?: string
  title?: string
  location?: string
  date?: string
  description?: string
}

const MAX_DESC_LENGTH = 200
const MIN_DESC_LENGTH = 5

/* ===================== 组件 ===================== */

export default function LostFoundForm({ onSuccess }: LostFoundFormProps) {
  const [form, setForm] = useState<FormData>({
    type: '',
    title: '',
    location: '',
    date: '',
    description: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

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

  /* ---------- 通用更新 ---------- */
  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  /* ---------- 单个字段验证 ---------- */
  const validateField = (key: keyof FormData, value: string): string | undefined => {
    switch (key) {
      case 'type': {
        if (!value) return '请选择类型'
        return undefined
      }
      case 'title': {
        if (!value.trim()) return '请输入物品名称'
        if (value.trim().length < 2) return '物品名称至少2个字'
        if (value.trim().length > 20) return '物品名称不超过20个字'
        return undefined
      }
      case 'location': {
        if (!value.trim()) return '请输入地点'
        return undefined
      }
      case 'date': {
        if (!value) return '请选择日期'
        return undefined
      }
      case 'description': {
        if (!value.trim()) return '请输入描述'
        if (value.trim().length < MIN_DESC_LENGTH) return '描述至少5个字'
        return undefined
      }
      default:
        return undefined
    }
  }

  /* ---------- 失焦验证 ---------- */
  const handleBlur = (key: keyof FormData) => {
    setTouched((prev) => new Set(prev).add(key))
    const err = validateField(key, form[key])
    setErrors((prev) => ({ ...prev, [key]: err }))
  }

  /* ---------- 提交 ---------- */
  const handleSubmit = async () => {
    // 全量验证
    const allKeys: (keyof FormErrors)[] = ['type', 'title', 'location', 'date', 'description']
    const newErrors: FormErrors = {}
    let hasError = false
    for (const key of allKeys) {
      const err = validateField(key, form[key])
      if (err) {
        newErrors[key] = err
        hasError = true
      }
    }
    setErrors(newErrors)
    setTouched(new Set([...touched, ...allKeys]))

    if (hasError) return

    // 提交
    setSubmitting(true)
    try {
      const body = {
        type: form.type,
        title: form.title.trim(),
        location: form.location.trim(),
        date: form.date,
        description: form.description.trim(),
      }
      const res = await fetch('/api/lost-found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('提交失败')

      showToast('发布成功！', 'success')
      setForm({ type: '', title: '', location: '', date: '', description: '' })
      setErrors({})
      setTouched(new Set())
      onSuccess?.()
    } catch {
      showToast('发布失败，请稍后重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------- 渲染 ---------- */
  return (
    <>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />

      <div className="max-w-[640px] mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-6">发布失物招领</h2>

          <div className="space-y-5">
            {/* ============ 类型切换 ============ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                类型 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {(['lost', 'found'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      updateField('type', type)
                      if (touched.has('type')) {
                        setErrors((prev) => ({ ...prev, type: undefined }))
                      }
                    }}
                    onBlur={() => handleBlur('type')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
                      form.type === type
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {type === 'lost' ? '丢失' : '捡到'}
                  </button>
                ))}
              </div>
              {touched.has('type') && errors.type && (
                <p className="mt-1.5 text-xs text-red-500">{errors.type}</p>
              )}
            </div>

            {/* ============ 物品名称 ============ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                物品名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                onBlur={() => handleBlur('title')}
                placeholder="请输入物品名称（2-20字）"
                maxLength={20}
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                  touched.has('title') && errors.title ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              {touched.has('title') && errors.title && (
                <p className="mt-1.5 text-xs text-red-500">{errors.title}</p>
              )}
            </div>

            {/* ============ 地点 ============ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                地点 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                onBlur={() => handleBlur('location')}
                placeholder="如：图书馆二楼"
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                  touched.has('location') && errors.location ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              {touched.has('location') && errors.location && (
                <p className="mt-1.5 text-xs text-red-500">{errors.location}</p>
              )}
            </div>

            {/* ============ 日期 ============ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
                onBlur={() => handleBlur('date')}
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                  touched.has('date') && errors.date ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              {touched.has('date') && errors.date && (
                <p className="mt-1.5 text-xs text-red-500">{errors.date}</p>
              )}
            </div>

            {/* ============ 描述 ============ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  onBlur={() => handleBlur('description')}
                  placeholder="请详细描述物品特征（5-200字）"
                  rows={4}
                  maxLength={MAX_DESC_LENGTH}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none ${
                    touched.has('description') && errors.description ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                <span className="absolute bottom-2.5 right-3 text-xs text-gray-400">
                  {form.description.length}/{MAX_DESC_LENGTH}
                </span>
              </div>
              {touched.has('description') && errors.description && (
                <p className="mt-1.5 text-xs text-red-500">{errors.description}</p>
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
              {submitting ? '提交中...' : '发布'}
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