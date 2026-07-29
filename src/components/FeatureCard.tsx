import { Link } from 'react-router-dom'

interface FeatureCardProps {
  title: string
  description: string
  icon: string
  link: string
}

export default function FeatureCard({ title, description, icon, link }: FeatureCardProps) {
  return (
    <Link
      to={link}
      className="block bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
    >
      <div className="text-5xl mb-4 text-center">{icon}</div>
      <h3 className="text-base font-semibold text-gray-800 text-center mb-1">{title}</h3>
      <p className="text-sm text-gray-400 text-center">{description}</p>
    </Link>
  )
}
