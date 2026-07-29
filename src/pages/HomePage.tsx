import FeatureCard from '../components/FeatureCard'

const features = [
  { title: '课表管理', description: '查看和管理你的课程表', icon: '📅', link: '/schedule' },
  { title: '食堂点评', description: '查看食堂菜单和评价', icon: '🍽️', link: '/canteen' },
  { title: '二手交易', description: '买卖闲置物品', icon: '🔄', link: '/trade' },
  { title: '失物招领', description: '发布和查找失物', icon: '🔍', link: '/lost-found' },
]

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-4xl font-bold text-emerald-950 mt-12 mb-2 text-center">
        XX大学校园助手
      </h1>
      <p className="text-lg text-gray-500 mb-12 text-center">
        让校园生活更便捷
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl">
        {features.map((item) => (
          <FeatureCard
            key={item.link}
            title={item.title}
            description={item.description}
            icon={item.icon}
            link={item.link}
          />
        ))}
      </div>
    </div>
  )
}
