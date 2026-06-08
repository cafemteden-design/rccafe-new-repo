import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Loader from './components/Loader.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Machines from './pages/Machines.jsx'
import Booking from './pages/Booking.jsx'
import Menu from './pages/Menu.jsx'
import Gallery from './pages/Gallery.jsx'
import Contact from './pages/Contact.jsx'
import Rewards from './pages/Rewards.jsx'
import RewardCard from './pages/RewardCard.jsx'
import StaffRewards from './pages/StaffRewards.jsx'
import AdminRewards from './pages/AdminRewards.jsx'
import NotFound from './pages/NotFound.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-charcoal-300">
      <Loader />
      <ScrollToTop />
      <Header />
      <main className="pt-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/machines" element={<Machines />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/rewards/card/:token" element={<RewardCard />} />
          <Route path="/reward-card" element={<RewardCard />} />
          <Route path="/staff-rewards" element={<StaffRewards />} />
          <Route path="/staff/rewards" element={<StaffRewards />} />
          <Route path="/admin-rewards" element={<AdminRewards />} />
          <Route path="/admin/rewards" element={<AdminRewards />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
