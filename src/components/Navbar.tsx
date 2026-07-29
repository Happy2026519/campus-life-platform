import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/schedule', label: '课表' },
  { to: '/canteen', label: '食堂' },
  { to: '/trade', label: '二手' },
  { to: '/lost-found', label: '失物招领' },
  { to: '/form', label: '表单' },
  { to: '/data', label: '数据' },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  // 从 localStorage 读取登录状态
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [user, setUser] = useState<{ id: number; username: string } | null>(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // 监听 localStorage 变化（其他页面登录后同步更新）
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'))
      try {
        const stored = localStorage.getItem('user')
        setUser(stored ? JSON.parse(stored) : null)
      } catch {
        setUser(null)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    navigate('/')
  }

  return (
    <nav
      className="text-white h-16 flex items-center px-6 fixed top-0 left-0 right-0 z-50 shadow-md"
      style={{ backgroundColor: '#1e3a5f' }}
    >
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link to="/" className="text-lg font-bold whitespace-nowrap">
          校园生活服务平台
        </Link>

        <div className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm transition-colors duration-200 hover:text-sky-300 ${
                location.pathname === link.to ? 'text-sky-300 font-semibold' : 'text-white/90'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {token && user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/90">
              {user.username}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold px-4 py-1.5 rounded-md border border-white text-white hover:bg-white hover:text-sky-950 transition-colors duration-200 whitespace-nowrap"
            >
              退出登录
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="text-sm font-semibold px-4 py-1.5 rounded-md border border-white text-white hover:bg-white hover:text-sky-950 transition-colors duration-200 whitespace-nowrap"
          >
            登录
          </Link>
        )}
      </div>
    </nav>
  )
}