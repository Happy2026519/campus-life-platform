/** 食堂数据类型 */
export interface Canteen {
  id: number
  name: string
  location: string
  rating: number
  tags: string[]
  image: string
}

/** 二手商品数据类型 */
export interface Item {
  id: number
  title: string
  price: number
  category: '教材' | '电子' | '生活' | '其他'
  image: string
  seller: string
}

/** 评价数据类型 */
export interface Review {
  id: number
  canteenId: number
  username: string
  content: string
  rating: number
  time: string
}

/** 生成纯色占位图 SVG Data URI（无需网络请求） */
function svgPlaceholder(text: string, bg = '#e2e8f0', fg = '#64748b'): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
      <rect width="400" height="300" fill="${bg}"/>
      <text x="200" y="150" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="20" fill="${fg}">${text}</text>
    </svg>`
  )}`
}

// ===================== 食堂列表 =====================
export const canteens: Canteen[] = [
  {
    id: 1,
    name: '第一食堂',
    location: '教学楼A区东侧',
    rating: 4.3,
    tags: ['家常菜', '麻辣烫', '快餐'],
    image: svgPlaceholder('第一食堂'),
  },
  {
    id: 2,
    name: '第二食堂',
    location: '学生宿舍区中心',
    rating: 4.1,
    tags: ['面食', '螺蛳粉', '炸鸡'],
    image: svgPlaceholder('第二食堂'),
  },
  {
    id: 3,
    name: '第三食堂',
    location: '图书馆南侧',
    rating: 4.5,
    tags: ['肠粉', '云吞', '包子', '粥'],
    image: svgPlaceholder('第三食堂'),
  },
  {
    id: 4,
    name: '教工食堂',
    location: '行政楼一楼',
    rating: 4.0,
    tags: ['小炒', '蒸菜', '营养餐'],
    image: svgPlaceholder('教工食堂'),
  },
]

// ===================== 二手商品列表 =====================
export const items: Item[] = [
  {
    id: 1,
    title: '《习近平新时代中国特色社会主义思想概论》二手教材',
    price: 15.00,
    category: '教材',
    image: svgPlaceholder('教材'),
    seller: '张三',
  },
  {
    id: 2,
    title: 'iPad Air 4 256G 银色',
    price: 2800.00,
    category: '电子',
    image: svgPlaceholder('iPad'),
    seller: '李四',
  },
  {
    id: 3,
    title: '瑜伽垫加厚防滑 全新未拆',
    price: 35.00,
    category: '生活',
    image: svgPlaceholder('瑜伽垫'),
    seller: '王五',
  },
  {
    id: 4,
    title: '尤克里里 入门款 送教程',
    price: 120.00,
    category: '其他',
    image: svgPlaceholder('尤克里里'),
    seller: '赵六',
  },
  {
    id: 5,
    title: '《高等数学（第七版）》上下册',
    price: 30.00,
    category: '教材',
    image: svgPlaceholder('高数'),
    seller: '孙七',
  },
  {
    id: 6,
    title: '小米充电宝 20000mAh',
    price: 65.00,
    category: '电子',
    image: svgPlaceholder('充电宝'),
    seller: '周八',
  },
]

// ===================== 评价列表 =====================
export const reviews: Review[] = [
  { id: 1, canteenId: 1, username: '小明', content: '麻辣烫味道不错，就是排队有点长。', rating: 4, time: '2025-07-20 12:30' },
  { id: 2, canteenId: 1, username: '小红', content: '红烧肉做得一般，偏咸了。', rating: 3, time: '2025-07-19 18:15' },
  { id: 3, canteenId: 2, username: '小刚', content: '螺蛳粉很地道！酸笋给得足。', rating: 5, time: '2025-07-21 11:45' },
  { id: 4, canteenId: 2, username: '小丽', content: '炸鸡块酥脆，配上可乐绝了。', rating: 4, time: '2025-07-20 17:30' },
  { id: 5, canteenId: 3, username: '小强', content: '早餐的肠粉很滑，推荐虾仁馅的。', rating: 5, time: '2025-07-22 08:10' },
  { id: 6, canteenId: 3, username: '小芳', content: '云吞面汤头鲜美，每周必吃。', rating: 4, time: '2025-07-21 12:00' },
  { id: 7, canteenId: 4, username: '张老师', content: '教工食堂环境好，午餐人少安静。', rating: 4, time: '2025-07-22 12:20' },
  { id: 8, canteenId: 4, username: '李老师', content: '蒸菜比较清淡，适合养生。', rating: 3, time: '2025-07-20 11:50' },
]

// ===================== 课表数据 =====================
export interface Course {
  id: number
  name: string
  teacher: string
  location: string
  dayOfWeek: number      // 1-7 周一至周日
  startSlot: number      // 第几节课开始
  endSlot: number        // 第几节课结束
  weeks: string          // 上课周数，如 "1-16周"
  color: string          // 课程卡片背景色
}

export const courses: Course[] = [
  { id: 1, name: '高等数学', teacher: '王教授', location: '教学楼A201', dayOfWeek: 1, startSlot: 1, endSlot: 2, weeks: '1-16周', color: 'bg-blue-100 border-blue-300 text-blue-800' },
  { id: 2, name: '大学英语', teacher: '李老师', location: '教学楼B305', dayOfWeek: 1, startSlot: 3, endSlot: 4, weeks: '1-16周', color: 'bg-green-100 border-green-300 text-green-800' },
  { id: 3, name: '线性代数', teacher: '张教授', location: '教学楼A103', dayOfWeek: 2, startSlot: 1, endSlot: 2, weeks: '1-16周', color: 'bg-purple-100 border-purple-300 text-purple-800' },
  { id: 4, name: '程序设计基础', teacher: '赵老师', location: '实验楼C201', dayOfWeek: 2, startSlot: 5, endSlot: 6, weeks: '1-16周', color: 'bg-orange-100 border-orange-300 text-orange-800' },
  { id: 5, name: '大学物理', teacher: '刘教授', location: '教学楼A301', dayOfWeek: 3, startSlot: 1, endSlot: 2, weeks: '1-16周', color: 'bg-rose-100 border-rose-300 text-rose-800' },
  { id: 6, name: '体育', teacher: '陈老师', location: '体育馆', dayOfWeek: 3, startSlot: 5, endSlot: 6, weeks: '1-16周', color: 'bg-cyan-100 border-cyan-300 text-cyan-800' },
  { id: 7, name: '数据结构', teacher: '王教授', location: '教学楼B201', dayOfWeek: 4, startSlot: 1, endSlot: 2, weeks: '1-16周', color: 'bg-indigo-100 border-indigo-300 text-indigo-800' },
  { id: 8, name: '思想道德与法治', teacher: '周老师', location: '教学楼A102', dayOfWeek: 4, startSlot: 7, endSlot: 8, weeks: '3-14周', color: 'bg-teal-100 border-teal-300 text-teal-800' },
  { id: 9, name: '概率论与数理统计', teacher: '张教授', location: '教学楼A202', dayOfWeek: 5, startSlot: 3, endSlot: 4, weeks: '1-16周', color: 'bg-pink-100 border-pink-300 text-pink-800' },
  { id: 10, name: '形势与政策', teacher: '吴老师', location: '教学楼B101', dayOfWeek: 5, startSlot: 7, endSlot: 8, weeks: '5-12周', color: 'bg-sky-100 border-sky-300 text-sky-800' },
]

// ===================== 自习室数据 =====================
export interface StudyRoom {
  id: number
  name: string
  building: string
  floor: number
  capacity: number
  available: boolean
  timeSlots: { time: string; available: boolean }[]
}

export const studyRooms: StudyRoom[] = [
  {
    id: 1, name: '自习室A101', building: '教学楼A', floor: 1, capacity: 80, available: true,
    timeSlots: [
      { time: '08:00-10:00', available: true },
      { time: '10:00-12:00', available: false },
      { time: '12:00-14:00', available: true },
      { time: '14:00-16:00', available: true },
      { time: '16:00-18:00', available: false },
      { time: '18:00-20:00', available: true },
      { time: '20:00-22:00', available: true },
    ],
  },
  {
    id: 2, name: '自习室A102', building: '教学楼A', floor: 1, capacity: 60, available: true,
    timeSlots: [
      { time: '08:00-10:00', available: true },
      { time: '10:00-12:00', available: true },
      { time: '12:00-14:00', available: false },
      { time: '14:00-16:00', available: true },
      { time: '16:00-18:00', available: true },
      { time: '18:00-20:00', available: false },
      { time: '20:00-22:00', available: true },
    ],
  },
  {
    id: 3, name: '自习室B201', building: '教学楼B', floor: 2, capacity: 100, available: false,
    timeSlots: [
      { time: '08:00-10:00', available: false },
      { time: '10:00-12:00', available: false },
      { time: '12:00-14:00', available: false },
      { time: '14:00-16:00', available: true },
      { time: '16:00-18:00', available: true },
      { time: '18:00-20:00', available: true },
      { time: '20:00-22:00', available: true },
    ],
  },
  {
    id: 4, name: '自习室B202', building: '教学楼B', floor: 2, capacity: 50, available: true,
    timeSlots: [
      { time: '08:00-10:00', available: true },
      { time: '10:00-12:00', available: true },
      { time: '12:00-14:00', available: true },
      { time: '14:00-16:00', available: false },
      { time: '16:00-18:00', available: false },
      { time: '18:00-20:00', available: true },
      { time: '20:00-22:00', available: true },
    ],
  },
  {
    id: 5, name: '自习室C301', building: '图书馆', floor: 3, capacity: 120, available: true,
    timeSlots: [
      { time: '08:00-10:00', available: false },
      { time: '10:00-12:00', available: false },
      { time: '12:00-14:00', available: true },
      { time: '14:00-16:00', available: true },
      { time: '16:00-18:00', available: true },
      { time: '18:00-20:00', available: false },
      { time: '20:00-22:00', available: false },
    ],
  },
  {
    id: 6, name: '自习室C302', building: '图书馆', floor: 3, capacity: 40, available: true,
    timeSlots: [
      { time: '08:00-10:00', available: true },
      { time: '10:00-12:00', available: true },
      { time: '12:00-14:00', available: true },
      { time: '14:00-16:00', available: true },
      { time: '16:00-18:00', available: true },
      { time: '18:00-20:00', available: true },
      { time: '20:00-22:00', available: true },
    ],
  },
]

// ===================== 失物招领数据 =====================
export interface LostItem {
  id: number
  title: string
  description: string
  location: string
  date: string
  type: 'lost' | 'found'
  contact: string
  status: '待认领' | '已认领' | '已归还'
  image: string
}

export const lostItems: LostItem[] = [
  { id: 1, title: '蓝色水杯', description: '膳魔师保温杯，蓝色，杯盖有轻微划痕', location: '第一食堂', date: '2025-07-25', type: 'lost', contact: '张同学 138****1234', status: '待认领', image: svgPlaceholder('水杯', '#dbeafe', '#3b82f6') },
  { id: 2, title: '校园一卡通', description: '尾号 2024 的校园卡，卡套为透明硅胶', location: '教学楼A201', date: '2025-07-24', type: 'lost', contact: '李同学 139****5678', status: '待认领', image: svgPlaceholder('校园卡', '#fef3c7', '#d97706') },
  { id: 3, title: '黑色书包', description: 'Nike 双肩背包，主袋内有《高等数学》教材', location: '图书馆二楼', date: '2025-07-23', type: 'lost', contact: '王同学 137****9012', status: '已认领', image: svgPlaceholder('书包', '#e0e7ff', '#6366f1') },
  { id: 4, title: '捡到黑色钱包', description: '在篮球场捡到，内有身份证和少量现金', location: '篮球场', date: '2025-07-26', type: 'found', contact: '体育部 12345678', status: '待认领', image: svgPlaceholder('钱包', '#fce7f3', '#ec4899') },
  { id: 5, title: '捡到白色耳机', description: 'AirPods Pro 白色，左耳有轻微划痕', location: '第三食堂', date: '2025-07-25', type: 'found', contact: '食堂服务台 87654321', status: '待认领', image: svgPlaceholder('耳机', '#f3e8ff', '#a855f7') },
  { id: 6, title: '捡到钥匙串', description: '银色钥匙串，带有3把钥匙和一个小熊挂件', location: '行政楼大厅', date: '2025-07-22', type: 'found', contact: '行政楼值班室 11223344', status: '已归还', image: svgPlaceholder('钥匙', '#fff7ed', '#ea580c') },
  { id: 7, title: '灰色围巾', description: '羊绒针织围巾，灰色，长约1.5米', location: '体育馆更衣室', date: '2025-07-21', type: 'lost', contact: '陈同学 136****3456', status: '待认领', image: svgPlaceholder('围巾', '#f1f5f9', '#64748b') },
  { id: 8, title: '捡到学生证', description: '2023级计算机学院，学号2023****0123', location: '校门口', date: '2025-07-20', type: 'found', contact: '保卫处 67890123', status: '已归还', image: svgPlaceholder('学生证', '#dcfce7', '#16a34a') },
]

// ===================== 个人中心统计 =====================
export interface ProfileStats {
  label: string
  value: number
  icon: string
  color: string
}

export const profileStats: ProfileStats[] = [
  { label: '今日课程', value: 4, icon: '📚', color: 'bg-blue-50 text-blue-600' },
  { label: '待办事项', value: 3, icon: '📋', color: 'bg-orange-50 text-orange-600' },
  { label: '食堂评价', value: 12, icon: '⭐', color: 'bg-amber-50 text-amber-600' },
  { label: '收藏商品', value: 5, icon: '❤️', color: 'bg-rose-50 text-rose-600' },
]
