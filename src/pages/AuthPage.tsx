import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../config/api'

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

/* ===================== 页面组件 ===================== */

export default function AuthPage() {
  const navigate = useNavigate()

  // 选项卡
  const [tab, setTab] = useState<'login' | 'register'>('login')

  // ===================== 登录状态 =====================
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginErrors, setLoginErrors] = useState({ username: '', password: '' })
  const [loginLoading, setLoginLoading] = useState(false)

  // ===================== 注册状态 =====================
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regErrors, setRegErrors] = useState({ username: '', password: '', confirmPassword: '' })
  const [regLoading, setRegLoading] = useState(false)

  // ===================== Toast =====================
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000)
  }

  // ===================== 切换选项卡时清空状态 =====================
  const switchTab = (newTab: 'login' | 'register') => {
    setTab(newTab)
    setLoginErrors({ username: '', password: '' })
    setRegErrors({ username: '', password: '', confirmPassword: '' })
  }

  // ===================== 登录验证 =====================
  const validateLogin = (): boolean => {
    const newErrors = {
      username: loginUsername.trim() ? '' : '请输入用户名',
      password: loginPassword.trim() ? '' : '请输入密码',
    }
    setLoginErrors(newErrors)
    return !newErrors.username && !newErrors.password
  }

  // ===================== 登录提交 =====================
  const handleLogin = async () => {
    if (!validateLogin()) return

    setLoginLoading(true)

    try {
      const res = await apiRequest<{ token: string; user: { id: number; username: string } }>({
        url: '/api/auth/login',
        method: 'POST',
        body: { username: loginUsername.trim(), password: loginPassword.trim() },
      })

      if (res.code === 200 && res.data) {
        // 保存 token 和用户信息
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))

        showToast('登录成功！', 'success')

        // 1秒后跳转到首页
        setTimeout(() => navigate('/'), 1000)
      } else {
        showToast(res.message || '用户名或密码错误', 'error')
      }
    } catch {
      showToast('登录失败，请稍后重试', 'error')
    } finally {
      setLoginLoading(false)
    }
  }

  // ===================== 注册验证 =====================
  const validateRegister = (): boolean => {
    const newErrors = { username: '', password: '', confirmPassword: '' }

    if (!regUsername.trim()) {
      newErrors.username = '请输入用户名'
    } else if (!/^[a-zA-Z0-9]{3,16}$/.test(regUsername.trim())) {
      newErrors.username = '用户名只能包含字母和数字，3-16字'
    }

    if (!regPassword.trim()) {
      newErrors.password = '请输入密码'
    } else if (regPassword.trim().length < 6) {
      newErrors.password = '密码至少6位'
    } else if (regPassword.trim().length > 20) {
      newErrors.password = '密码不超过20位'
    }

    if (!regConfirmPassword.trim()) {
      newErrors.confirmPassword = '请确认密码'
    } else if (regConfirmPassword.trim() !== regPassword.trim()) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setRegErrors(newErrors)
    return !newErrors.username && !newErrors.password && !newErrors.confirmPassword
  }

  // ===================== 注册提交 =====================
  const handleRegister = async () => {
    if (!validateRegister()) return

    setRegLoading(true)
    try {
      const res = await apiRequest<{ id: number; username: string }>({
        url: '/api/auth/register',
        method: 'POST',
        body: { username: regUsername.trim(), password: regPassword.trim() },
      })

      if (res.code === 201) {
        showToast('注册成功！', 'success')
        // 清空注册表单
        setRegUsername('')
        setRegPassword('')
        setRegConfirmPassword('')
        setRegErrors({ username: '', password: '', confirmPassword: '' })
        // 自动切换到登录表单
        setTab('login')
      } else {
        showToast(res.message || '注册失败，请稍后重试', 'error')
      }
    } catch {
      showToast('注册失败，请稍后重试', 'error')
    } finally {
      setRegLoading(false)
    }
  }

  // ===================== 渲染 =====================
  return (
    <>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />

      <div className="flex items-center justify-center py-16">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {/* ===== 选项卡 ===== */}
          <div className="flex mb-6 border-b border-gray-200">
            {(['login', 'register'] as const).map((item) => (
              <button
                key={item}
                onClick={() => switchTab(item)}
                className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
                  tab === item
                    ? 'text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {item === 'login' ? '登录' : '注册'}
                {tab === item && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* ===== 登录表单 ===== */}
          {tab === 'login' && (
            <div className="space-y-4">
              {/* 用户名 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">用户名</label>
                <input
                  type="text"
                  placeholder="请输入用户名"
                  value={loginUsername}
                  onChange={(e) => {
                    setLoginUsername(e.target.value)
                    if (loginErrors.username) setLoginErrors((prev) => ({ ...prev, username: '' }))
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                    loginErrors.username
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                />
                {loginErrors.username && (
                  <p className="text-xs text-red-500 mt-1">{loginErrors.username}</p>
                )}
              </div>

              {/* 密码 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">密码</label>
                <input
                  type="password"
                  placeholder="请输入密码"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value)
                    if (loginErrors.password) setLoginErrors((prev) => ({ ...prev, password: '' }))
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                    loginErrors.password
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                />
                {loginErrors.password && (
                  <p className="text-xs text-red-500 mt-1">{loginErrors.password}</p>
                )}
              </div>

              {/* 登录按钮 */}
              <button
                onClick={handleLogin}
                disabled={loginLoading}
                className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {loginLoading && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {loginLoading ? '登录中...' : '登录'}
              </button>
            </div>
          )}

          {/* ===== 注册表单 ===== */}
          {tab === 'register' && (
            <div className="space-y-4">
              {/* 用户名 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">用户名</label>
                <input
                  type="text"
                  placeholder="字母和数字，3-16字"
                  value={regUsername}
                  onChange={(e) => {
                    setRegUsername(e.target.value)
                    if (regErrors.username) setRegErrors((prev) => ({ ...prev, username: '' }))
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                    regErrors.username
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                />
                {regErrors.username && (
                  <p className="text-xs text-red-500 mt-1">{regErrors.username}</p>
                )}
              </div>

              {/* 密码 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">密码</label>
                <input
                  type="password"
                  placeholder="6-20位密码"
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value)
                    if (regErrors.password) setRegErrors((prev) => ({ ...prev, password: '' }))
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                    regErrors.password
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                />
                {regErrors.password && (
                  <p className="text-xs text-red-500 mt-1">{regErrors.password}</p>
                )}
              </div>

              {/* 确认密码 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">确认密码</label>
                <input
                  type="password"
                  placeholder="再次输入密码"
                  value={regConfirmPassword}
                  onChange={(e) => {
                    setRegConfirmPassword(e.target.value)
                    if (regErrors.confirmPassword) setRegErrors((prev) => ({ ...prev, confirmPassword: '' }))
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                    regErrors.confirmPassword
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                />
                {regErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{regErrors.confirmPassword}</p>
                )}
              </div>

              {/* 注册按钮 */}
              <button
                onClick={handleRegister}
                disabled={regLoading}
                className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {regLoading && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {regLoading ? '注册中...' : '注册'}
              </button>
            </div>
          )}
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