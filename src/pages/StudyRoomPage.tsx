import { useState } from 'react'
import { studyRooms } from '../data/mockData'
import type { StudyRoom } from '../data/mockData'

export default function StudyRoomPage() {
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null)
  const [bookedSlots, setBookedSlots] = useState<Map<number, string>>(new Map())
  const [bookingRoomId, setBookingRoomId] = useState<number | null>(null)
  const [bookingSlot, setBookingSlot] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleBook = (roomId: number) => {
    if (!bookingSlot) return
    setBookedSlots((prev) => {
      const next = new Map(prev)
      next.set(roomId, bookingSlot)
      return next
    })
    setSuccessMsg(`自习室 ${studyRooms.find((r) => r.id === roomId)?.name} ${bookingSlot} 预约成功！`)
    setBookingRoomId(null)
    setBookingSlot('')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  return (
    <div>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-emerald-950">自习室预约</h1>
        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium">
          今日可预约
        </span>
      </div>

      {/* 成功提示 */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium animate-[fadeIn_0.3s_ease-out]">
          ✅ {successMsg}
        </div>
      )}

      {/* 自习室列表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {studyRooms.map((room) => {
          const bookedSlot = bookedSlots.get(room.id)

          return (
            <div
              key={room.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              {/* 卡片头部 */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setSelectedRoom(selectedRoom?.id === room.id ? null : room)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-800">{room.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      room.available
                        ? 'bg-green-50 text-green-600'
                        : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {room.available ? '可预约' : '已满'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{room.building}</span>
                  <span>{room.floor}F</span>
                  <span>{room.capacity}座</span>
                </div>
                {bookedSlot && (
                  <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    已预约：{bookedSlot}
                  </div>
                )}
              </div>

              {/* 展开时段 */}
              {selectedRoom?.id === room.id && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">可选时段：</p>
                  <div className="grid grid-cols-2 gap-2">
                    {room.timeSlots.map((slot) => {
                      const isBooked = bookedSlots.get(room.id) === slot.time
                      const canBook = slot.available && !isBooked
                      return (
                        <button
                          key={slot.time}
                          onClick={() => {
                            if (!canBook) return
                            setBookingRoomId(room.id)
                            setBookingSlot(slot.time)
                          }}
                          disabled={!canBook}
                          className={`text-xs px-2 py-1.5 rounded-lg border transition-all duration-200 ${
                            isBooked
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-700 cursor-default'
                              : slot.available
                              ? 'bg-white border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 cursor-pointer'
                              : 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          {isBooked ? '✓ ' + slot.time : slot.time}
                        </button>
                      )
                    })}
                  </div>

                  {/* 确认预约按钮 */}
                  {bookingRoomId === room.id && bookingSlot && (
                    <button
                      onClick={() => handleBook(room.id)}
                      className="mt-3 w-full py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 active:scale-[0.98] transition-all duration-200"
                    >
                      确认预约 {bookingSlot}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 无结果 */}
      {studyRooms.length === 0 && (
        <p className="text-gray-400 text-center py-12">暂无可用自习室</p>
      )}
    </div>
  )
}