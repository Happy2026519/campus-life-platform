import { useState } from 'react'

interface FormData {
  name: string
  studentId: string
  phone: string
  email: string
  department: string
  reason: string
}

const departments = ['计算机科学与技术学院', '数学与统计学院', '外国语学院', '经济管理学院', '电子信息工程学院', '人文学院']

export default function FormPage() {
  const [form, setForm] = useState<FormData>({
    name: '', studentId: '', phone: '', email: '', department: '', reason: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!form.name.trim()) newErrors.name = '请输入姓名'
    if (!form.studentId.trim()) newErrors.studentId = '请输入学号'
    else if (!/^\d{10,12}$/.test(form.studentId.trim())) newErrors.studentId = '学号格式不正确（10-12位数字）'
    if (!form.phone.trim()) newErrors.phone = '请输入联系电话'
    else if (!/^1\d{10}$/.test(form.phone.trim())) newErrors.phone = '手机号格式不正确'
    if (!form.email.trim()) newErrors.email = '请输入邮箱'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) newErrors.email = '邮箱格式不正确'
    if (!form.department) newErrors.department = '请选择学院'
    if (!form.reason.trim()) newErrors.reason = '请填写申请原因'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    setForm({ name: '', studentId: '', phone: '', email: '', department: '', reason: '' })
  }

  const inputClass = (field: keyof FormData) =>
    `w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
        : 'border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
    }`

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-emerald-950">申请表单</h1>
        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium">
          在线申请
        </span>
      </div>

      {submitted && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium animate-[fadeIn_0.3s_ease-out]">
          ✅ 申请提交成功！我们会尽快处理你的申请。
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5"
      >
        {/* 姓名 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            姓名 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="请输入姓名"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={inputClass('name')}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* 学号 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            学号 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="请输入学号"
            value={form.studentId}
            onChange={(e) => handleChange('studentId', e.target.value)}
            className={inputClass('studentId')}
          />
          {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
        </div>

        {/* 联系电话 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            联系电话 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="请输入手机号"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={inputClass('phone')}
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>

        {/* 邮箱 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            邮箱 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="请输入邮箱地址"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={inputClass('email')}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        {/* 学院下拉 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            学院 <span className="text-red-400">*</span>
          </label>
          <select
            value={form.department}
            onChange={(e) => handleChange('department', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition appearance-none bg-white ${
              errors.department
                ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
            } ${!form.department ? 'text-gray-400' : 'text-gray-700'}`}
          >
            <option value="">请选择学院</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
        </div>

        {/* 申请原因 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            申请原因 <span className="text-red-400">*</span>
          </label>
          <textarea
            placeholder="请详细描述你的申请原因..."
            value={form.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition resize-none ${
              errors.reason
                ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
            }`}
          />
          {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
        </div>

        {/* 提交按钮 */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 active:scale-[0.98] transition-all duration-200"
          >
            提交申请
          </button>
          <button
            type="reset"
            onClick={() => {
              setForm({ name: '', studentId: '', phone: '', email: '', department: '', reason: '' })
              setErrors({})
            }}
            className="px-6 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 active:scale-[0.98] transition-all duration-200"
          >
            重置
          </button>
        </div>
      </form>
    </div>
  )
}