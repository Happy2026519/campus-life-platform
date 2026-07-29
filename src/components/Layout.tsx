import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-emerald-50">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-20 pb-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
