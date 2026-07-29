import { useState } from 'react'

interface RatingStarsProps {
  /** 当前评分（0-5） */
  rating: number
  /** 评分变化回调 */
  onChange?: (newRating: number) => void
  /** 是否只读（默认 false） */
  readonly?: boolean
}

export default function RatingStars({ rating, onChange, readonly = false }: RatingStarsProps) {
  // 悬停预览的分值（-1 表示未悬停）
  const [hoverValue, setHoverValue] = useState(-1)

  // 实际展示的分值：悬停时用预览值，否则用实际评分
  const displayValue = hoverValue >= 0 ? hoverValue : rating

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        // 判断当前星是否高亮
        const filled = star <= displayValue

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => {
              if (!readonly && onChange) {
                onChange(star)
              }
            }}
            onMouseEnter={() => {
              if (!readonly) setHoverValue(star)
            }}
            onMouseLeave={() => {
              if (!readonly) setHoverValue(-1)
            }}
            className={`text-xl leading-none transition-colors duration-150 ${
              readonly ? 'cursor-default' : 'cursor-pointer'
            } ${filled ? 'text-amber-400' : 'text-gray-300'}`}
          >
            {filled ? '★' : '☆'}
          </button>
        )
      })}
    </div>
  )
}
