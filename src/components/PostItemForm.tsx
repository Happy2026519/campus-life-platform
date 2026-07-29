import { useState, useRef, useCallback } from 'react'
import { apiRequest } from '../config/api'

/* ===================== Toast 组件 ===================== */
interface ToastProps {
  message: string
  type: 'success' | 'error'
  visible: boolean
}

function Toast({ message, type, visible }: ToastProps) {
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

interface PostItemFormProps {
  /** 提交成功后的回调 */
  onSuccess?: () => void
  /** 取消按钮的回调 */
  onCancel?: () => void
}

interface FormData {
  title: string
  description: string
  price: string
  category: string
  images: File[]
  contact: string
}

interface FormErrors {
  title?: string
  description?: string
  price?: string
  category?: string
  contact?: string
}

/* ===================== 常量 ===================== */

const CATEGORIES = ['教材', '电子', '生活', '其他']
const MAX_IMAGES = 3
const MAX_DESC_LENGTH = 500

/* ===================== 组件 ===================== */

export default function PostItemForm({ onSuccess, onCancel }: PostItemFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    images: [],
    contact: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  })
  const [isDragOver, setIsDragOver] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  /* ---------- Toast 辅助 ---------- */
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000)
  }, [])

  /* ---------- 通用更新 ---------- */
  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    // 用户修改时清除该字段错误
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  /* ---------- 单个字段验证 ---------- */
  const validateField = (key: keyof FormData, value: string | File[]): string | undefined => {
    switch (key) {
      case 'title': {
        if (!value || (value as string).trim() === '') return '请输入商品名称'
        if ((value as string).trim().length < 2) return '商品名称至少2个字'
        if ((value as string).trim().length > 30) return '商品名称不超过30个字'
        return undefined
      }
      case 'description': {
        if (!value || (value as string).trim() === '') return '请输入商品描述'
        const len = (value as string).trim().length
        if (len < 10) return '描述至少10个字'
        if (len > MAX_DESC_LENGTH) return `描述不超过${MAX_DESC_LENGTH}个字`
        return undefined
      }
      case 'price': {
        if (!value || (value as string).trim() === '') return '请输入价格'
        const num = Number(value)
        if (isNaN(num) || num <= 0) return '请输入有效的价格'
        return undefined
      }
      case 'category': {
        if (!value || (value as string) === '') return '请选择分类'
        return undefined
      }
      case 'contact': {
        if (!value || (value as string).trim() === '') return '请填写联系方式'
        return undefined
      }
      default:
        return undefined
    }
  }

  /* ---------- 失焦验证 ---------- */
  const handleBlur = (key: keyof FormData) => {
    setTouched((prev) => new Set(prev).add(key))
    const err = validateField(key, key === 'images' ? [] : form[key])
    setErrors((prev) => ({ ...prev, [key]: err }))
  }

  /* ---------- 图片上传 ---------- */
  const addImages = (files: FileList | null) => {
    if (!files) return
    const remaining = MAX_IMAGES - form.images.length
    const validFiles: File[] = []
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      if (files[i].type.startsWith('image/')) {
        validFiles.push(files[i])
      }
    }
    updateField('images', [...form.images, ...validFiles])
  }

  const removeImage = (index: number) => {
    updateField('images', form.images.filter((_, i) => i !== index))
  }

  /* ---------- 拖拽 ---------- */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    setIsDragOver(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragOver(false)
    }
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    dragCounter.current = 0
    addImages(e.dataTransfer.files)
  }

  /* ---------- AI 生成描述 ---------- */
  const handleAiGenerate = async () => {
    // 验证商品名称
    const titleErr = validateField('title', form.title)
    if (titleErr) {
      showToast('请先填写商品名称', 'error')
      return
    }
    // 验证价格
    const priceErr = validateField('price', form.price)
    if (priceErr) {
      showToast('请先填写价格', 'error')
      return
    }

    setAiLoading(true)
    try {
      const res = await apiRequest<{ description: string }>({
        url: '/api/ai/generate-description',
        method: 'POST',
        body: { title: form.title.trim(), price: form.price },
      })
      if (res.code === 200 && res.data?.description) {
        updateField('description', res.data.description)
        showToast('AI描述已生成，你可以修改后发布', 'success')
      } else {
        showToast('AI生成失败，请手动填写描述', 'error')
      }
    } catch {
      showToast('AI生成失败，请手动填写描述', 'error')
    } finally {
      setAiLoading(false)
    }
  }

  /* ---------- 提交 ---------- */
  const handleSubmit = async () => {
    // 全量验证
    const allKeys: (keyof FormErrors)[] = ['title', 'description', 'price', 'category', 'contact']
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
    // 标记所有字段已 touched
    setTouched(new Set([...touched, ...allKeys]))

    if (hasError) return

    // 提交
    setSubmitting(true)
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        contact: form.contact.trim(),
      }
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('提交失败')
      // 成功
      showToast('发布成功！', 'success')
      setForm({ title: '', description: '', price: '', category: '', images: [], contact: '' })
      setErrors({})
      setTouched(new Set())
      onSuccess?.()
    } catch {
      showToast('发布失败，请稍后重试', 'error')
      // 保留已填内容
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------- 图片预览 URL ---------- */
  const imagePreviews = form.images.map((file) => URL.createObjectURL(file))

  /* ---------- 渲染 ---------- */

  return (
    <>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />

      <div className="max-w-[640px] mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-6">发布二手商品</h2>

          <div className="space-y-5">
            {/* ============ 商品名称 ============ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                商品名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                onBlur={() => handleBlur('title')}
                placeholder="请输入商品名称（2-30字）"
                maxLength={30}
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                  touched.has('title') && errors.title ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              {touched.has('title') && errors.title && (
                <p className="mt-1 text-xs text-red-500">{errors.title}</p>
              )}
            </div>

            {/* ============ 商品描述 ============ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                商品描述 <span className="text-red-500">*</span>
              </label>
              {/* AI 生成描述按钮 */}
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-violet-400 text-violet-600 text-xs font-medium rounded-lg hover:bg-violet-50 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
                >
                  {aiLoading ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      生成中...
                    </>
                  ) : (
                    '🤖 AI帮我写描述'
                  )}
                </button>
              </div>
              <div className="relative">
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  onBlur={() => handleBlur('description')}
                  placeholder="请详细描述商品状况、成色等信息（10-500字）"
                  rows={4}
                  maxLength={MAX_DESC_LENGTH}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none ${
                    touched.has('description') && errors.description ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                  {form.description.length}/{MAX_DESC_LENGTH}
                </span>
              </div>
              {touched.has('description') && errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description}</p>
              )}
            </div>

            {/* ============ 价格 ============ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                价格 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">¥</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  onBlur={() => handleBlur('price')}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                    touched.has('price') && errors.price ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
              </div>
              {touched.has('price') && errors.price && (
                <p className="mt-1 text-xs text-red-500">{errors.price}</p>
              )}
            </div>

            {/* ============ 分类 ============ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                onBlur={() => handleBlur('category')}
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white ${
                  touched.has('category') && errors.category ? 'border-red-400' : 'border-gray-200'
                } ${!form.category ? 'text-gray-400' : 'text-gray-800'}`}
              >
                <option value="" disabled>请选择分类</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="text-gray-800">{cat}</option>
                ))}
              </select>
              {touched.has('category') && errors.category && (
                <p className="mt-1 text-xs text-red-500">{errors.category}</p>
              )}
            </div>

            {/* ============ 图片上传 ============ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                图片 <span className="text-gray-400 text-xs">（可选，最多3张）</span>
              </label>
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addImages(e.target.files)}
                  disabled={form.images.length >= MAX_IMAGES}
                />
                <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <p className="text-sm text-gray-500">
                  {isDragOver ? '松开以上传图片' : '点击或拖拽图片到此处上传'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {form.images.length}/{MAX_IMAGES} 张
                </p>
              </div>

              {/* 缩略图预览 */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {imagePreviews.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                      <img src={url} alt={`预览 ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(i)
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800/70 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ============ 联系方式 ============ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系方式 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => updateField('contact', e.target.value)}
                onBlur={() => handleBlur('contact')}
                placeholder="手机号或微信号"
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                  touched.has('contact') && errors.contact ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              {touched.has('contact') && errors.contact && (
                <p className="mt-1 text-xs text-red-500">{errors.contact}</p>
              )}
            </div>
          </div>

          {/* ============ 按钮组 ============ */}
          <div className="mt-6 flex items-center gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                取消
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 py-2.5 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 ${
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
              {submitting ? '发布中...' : '发布商品'}
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