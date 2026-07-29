import { useState } from 'react'
import { profileStats } from '../data/mockData'
import { Link } from 'react-router-dom'

const menuItems = [
  { icon: '📅', label: '我的课表', link: '/schedule', desc: '查看课程安排' },
  { icon: '🍽️', label: '我的评价', link: '/canteen', desc: '食堂点评记录' },
  { icon: '🔄', label: '我的发布', link: '/trade', desc: '二手商品管理' },
  { icon: '🔍', label: '我的认领', link: '/lost-found', desc: '失物招领记录' },
  { icon: '⏰', label: '自习记录', link: '/study-room', desc: '预约历史' },
  { icon: '⚙️', label: '系统设置', link: '#', desc: '账号与偏好设置' },
]

export default function ProfilePage() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  return (
    <div>
      {/* 用户信息卡片 */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          {/* 头像 */}
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl backdrop-blur-sm border-2 border-white/30">
            👤
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">校园用户</h2>
            <p className="text-sm text-white/70">2023级 · 计算机科学与技术</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-white/60">
              <span>学号：2023****0123</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>已认证</span>
            </div>
          </div>
          <Link
            to="/auth"
            className="px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-medium hover:bg-white/25 transition-colors backdrop-blur-sm border border-white/20"
          >
            编辑资料
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {profileStats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer ${stat.color}`}
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs mt-0.5 opacity-70">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 功能菜单列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {menuItems.map((item, idx) => {
          const isActive = activeMenu === item.label
          return (
            <Link
              key={item.label}
              to={item.link}
              onMouseEnter={() => setActiveMenu(item.label)}
              onMouseLeave={() => setActiveMenu(null)}
              className={`flex items-center gap-4 px-5 py-4 transition-all duration-200 ${
                idx !== menuItems.length - 1 ? 'border-b border-gray-50' : ''
              } ${
                isActive
                  ? 'bg-emerald-50/50 -mx-0'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">{item.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
              </div>
              <svg
                className={`w-4 h-4 text-gray-300 transition-all duration-200 ${
                  isActive ? 'translate-x-1 text-emerald-500' : ''
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )
        })}
      </div>
    </div>
  )
}