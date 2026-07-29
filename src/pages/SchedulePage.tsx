import { useState } from 'react'
import { courses } from '../data/mockData'
import type { Course } from '../data/mockData'

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const slotLabels = ['第1-2节\n08:00-09:40', '第3-4节\n10:00-11:40', '第5-6节\n14:00-15:40', '第7-8节\n16:00-17:40', '第9-10节\n19:00-20:40']

export default function SchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(8)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  // 模拟周次（1-18）
  const weekStart = Math.max(1, currentWeek - 2)
  const weekOptions = Array.from({ length: 5 }, (_, i) => weekStart + i).filter((w) => w >= 1 && w <= 18)

  // 根据当前周筛选课程
  const visibleCourses = courses.filter((c) => {
    const match = c.weeks.match(/(\d+)-(\d+)周/)
    if (!match) return true
    const [_, startStr, endStr] = match
    return currentWeek >= parseInt(startStr) && currentWeek <= parseInt(endStr)
  })

  // 用 visibleCourses 重建 slotMap
  function buildVisibleSlotMap() {
    const map = new Map<string, Course>()
    visibleCourses.forEach((c) => {
      const key = `${c.dayOfWeek}-${c.startSlot}`
      map.set(key, c)
    })
    return map
  }
  const visibleSlotMap = buildVisibleSlotMap()

  return (
    <div>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-emerald-950">课表管理</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-gray-400">当前学期 · 2025春</span>
        </div>
      </div>

      {/* 周次切换 */}
      <div className="flex items-center justify-between mb-5 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">教学周：</span>
          <div className="flex gap-1.5">
            {weekOptions.map((w) => (
              <button
                key={w}
                onClick={() => setCurrentWeek(w)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  currentWeek === w
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                第{w}周
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
            disabled={currentWeek <= 1}
            className="px-3 py-1 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← 上一周
          </button>
          <button
            onClick={() => setCurrentWeek(Math.min(18, currentWeek + 1))}
            disabled={currentWeek >= 18}
            className="px-3 py-1 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            下一周 →
          </button>
        </div>
      </div>

      {/* 课表网格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* 表头 */}
        <div className="grid grid-cols-[90px_repeat(5,1fr)] border-b border-gray-100">
          <div className="p-3 text-xs font-medium text-gray-400 text-center border-r border-gray-100 bg-gray-50">
            时间
          </div>
          {dayNames.slice(0, 5).map((name) => (
            <div
              key={name}
              className="p-3 text-sm font-semibold text-gray-700 text-center bg-gray-50"
            >
              {name}
            </div>
          ))}
        </div>

        {/* 课表行 */}
        {slotLabels.map((slotLabel, rowIdx) => {
          const slotNum = rowIdx * 2 + 1
          const lines = slotLabel.split('\n')
          return (
            <div
              key={rowIdx}
              className="grid grid-cols-[90px_repeat(5,1fr)] border-b border-gray-50 last:border-b-0"
            >
              {/* 时间列 */}
              <div className="p-2 text-xs text-gray-400 text-center border-r border-gray-50 flex flex-col items-center justify-center leading-tight">
                <span>{lines[0]}</span>
                <span className="text-[10px] text-gray-300">{lines[1]}</span>
              </div>

              {/* 5天 */}
              {[1, 2, 3, 4, 5].map((day) => {
                const key = `${day}-${slotNum}`
                const course = visibleSlotMap.get(key)
                return (
                  <div
                    key={day}
                    className={`p-1.5 min-h-[72px] border-r border-gray-50 last:border-r-0 ${
                      course ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => course && setSelectedCourse(course)}
                  >
                    {course && (
                      <div
                        className={`h-full rounded-lg p-2 border text-xs leading-tight transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${course.color}`}
                      >
                        <div className="font-semibold mb-0.5">{course.name}</div>
                        <div className="text-[10px] opacity-75">{course.teacher}</div>
                        <div className="text-[10px] opacity-60">{course.location}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* 课程详情弹窗 */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setSelectedCourse(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-[fadeIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">{selectedCourse.name}</h3>
              <button
                onClick={() => setSelectedCourse(null)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="w-16 text-gray-400">授课教师</span>
                <span className="text-gray-700 font-medium">{selectedCourse.teacher}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 text-gray-400">上课地点</span>
                <span className="text-gray-700">{selectedCourse.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 text-gray-400">上课时间</span>
                <span className="text-gray-700">
                  {dayNames[selectedCourse.dayOfWeek - 1]} 第{selectedCourse.startSlot}-{selectedCourse.endSlot}节
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 text-gray-400">教学周次</span>
                <span className="text-gray-700">{selectedCourse.weeks}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedCourse(null)}
              className="mt-5 w-full py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition-colors"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  )
}