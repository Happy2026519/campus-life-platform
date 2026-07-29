import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SchedulePage from './pages/SchedulePage'
import TradePage from './pages/TradePage'
import StudyRoomPage from './pages/StudyRoomPage'
import CanteenPage from './pages/CanteenPage'
import LostFoundPage from './pages/LostFoundPage'
import ProfilePage from './pages/ProfilePage'
import AuthPage from './pages/AuthPage'
import FormPage from './pages/FormPage'
import DataPage from './pages/DataPage'

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/trade" element={<TradePage />} />
        <Route path="/study-room" element={<StudyRoomPage />} />
        <Route path="/canteen" element={<CanteenPage />} />
        <Route path="/lost-found" element={<LostFoundPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/data" element={<DataPage />} />
      </Route>
    </Routes>
  )
}