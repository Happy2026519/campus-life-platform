import { useState } from 'react'

interface UserRecord {
  id: number
  name: string
  department: string
  date: string
  status: '已通过' | '审核中' | '已驳回'
  score: number
}

const mockData: UserRecord[] = [
  { id: 1001, name: '张三', department: '计算机科学与技术学院', date: '2025-07-20', status: '已通过', score: 92 },
  { id: 1002, name: '李四', department: '数学与统计学院', date: '2025-07-19', status: '审核中', score: 85 },
  { id: 1003, name: '王五', department: '外国语学院', date: '2025-07-18', status: '已通过', score: 78 },
  { id: 1004, name: '赵六', department: '经济管理学院', date: '2025-07-17', status: '已驳回', score: 63 },
  { id: 1005, name: '孙七', department: '电子信息工程学院', date: '2025-07-16', status: '已通过', score: 95 },
  { id: 1006, name: '周八', department: '人文学院', date: '2025-07-15', status: '审核中', score: 71 },
  { id: 1007, name: '吴九', department: '计算机科学与技术学院', date: '2025-07-14', status: '已通过', score: 88 },
  { id: 1008, name: '郑十', department: '数学与统计学院', date: '2025-07-13', status: '已驳回', score: 55 },
]

const statusColors: Record<string, string> = {
  '已通过': 'bg-green-50 text-green-600',
  '审核中': 'bg-amber-50 text-amber-600',
  '已驳回': 'bg-red-50 text-red-500',
}

export default function DataPage() {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [sortField, setSortField] = useState<'date' | 'score' | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 4

  // 筛选
  let filtered = mockData.filter((r) => {
    const matchSearch =
      !searchText ||
      r.name.includes(searchText) ||
      r.department.includes(searchText) ||
      String(r.id).includes(searchText)
    const matchStatus = statusFilter === '全部' || r.status === statusFilter
    return matchSearch && matchStatus
  })

  // 排序
  if (sortField) {
    filtered = [...filtered].sort((a, b) => {
      const val = sortField === 'date'
        ? a.date.localeCompare(b.date)
        : a.score - b.score
      return sortDir === 'asc' ? val : -val
    })
  }

  // 分页
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSort = (field: 'date' | 'score') => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ field }: { field: 'date' | 'score' }) => {
    if (sortField !== field) return <span className="text-gray-200 ml-1">↕</span>
    return <span className="text-emerald-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-emerald-950">数据管理</h1>
        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium">
          共 {mockData.length} 条记录
        </span>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3 mb-5 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
        {/* 搜索框 */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="搜索姓名 / 学院 / 编号..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1) }}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
        </div>

        {/* 状态筛选 */}
        <div className="flex gap-1.5">
          {['全部', '已通过', '审核中', '已驳回'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                statusFilter === s
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">编号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">姓名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">学院</th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-400 cursor-pointer select-none hover:text-gray-600 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  日期 <SortIcon field="date" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">状态</th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-400 cursor-pointer select-none hover:text-gray-600 transition-colors"
                  onClick={() => handleSort('score')}
                >
                  评分 <SortIcon field="score" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => {
                const isSelected = selectedRow === row.id
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRow(isSelected ? null : row.id)}
                    className={`border-b border-gray-50 last:border-b-0 transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/60'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{row.id}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.department}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${
                        row.score >= 90 ? 'text-green-600' : row.score >= 70 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {row.score}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          alert(`查看详情：${row.name}（编号 ${row.id}）`)
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                )
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    没有匹配的数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-400">
              第 {currentPage} / {totalPages} 页
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1 rounded text-xs bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                    currentPage === p
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 rounded text-xs bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 选中行详情 */}
      {selectedRow !== null && (
        <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-[fadeIn_0.2s_ease-out]">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">行详情</h3>
          {(() => {
            const row = mockData.find((r) => r.id === selectedRow)
            if (!row) return null
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block">编号</span>
                  <span className="text-gray-700 font-mono">{row.id}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">姓名</span>
                  <span className="text-gray-700">{row.name}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">学院</span>
                  <span className="text-gray-700">{row.department}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">日期</span>
                  <span className="text-gray-700">{row.date}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">状态</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[row.status]}`}>
                    {row.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">评分</span>
                  <span className="text-gray-700 font-semibold">{row.score}</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}