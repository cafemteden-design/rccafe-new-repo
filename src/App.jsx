import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Loader from './components/Loader.jsx'
import Analytics from './components/Analytics.jsx'
import SEO from './components/SEO.jsx'
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import { LANDING_PAGES } from './data/landingPages.js'
import { organizationSchema, websiteSchema, localBusinessSchema } from './data/seo.js'
import { useAnalytics } from './hooks/useAnalytics.js'
import { AdminAuthProvider } from './admin/AdminAuthContext.jsx'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'

// Lazy-load SEO landing pages, blog, and package pages to reduce main bundle size.
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Machines = lazy(() => import('./pages/Machines.jsx'))
const Booking = lazy(() => import('./pages/Booking.jsx'))
const Menu = lazy(() => import('./pages/Menu.jsx'))
const Gallery = lazy(() => import('./pages/Gallery.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const Blog = lazy(() => import('./pages/Blog.jsx'))
const BlogPost = lazy(() => import('./pages/BlogPost.jsx'))
const FAQ = lazy(() => import('./pages/FAQ.jsx'))
const Experience = lazy(() => import('./pages/Experience.jsx'))
const Rewards = lazy(() => import('./pages/Rewards.jsx'))
const RewardCard = lazy(() => import('./pages/RewardCard.jsx'))
const WhyRCC = lazy(() => import('./pages/WhyRCC.jsx'))
const BirthdayPackages = lazy(() => import('./pages/BirthdayPackages.jsx'))
const CorporatePackages = lazy(() => import('./pages/CorporatePackages.jsx'))
const GroupBookingPackages = lazy(() => import('./pages/GroupBookingPackages.jsx'))
const SchoolHolidayPackages = lazy(() => import('./pages/SchoolHolidayPackages.jsx'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.jsx'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'))
const AdminModulePage = lazy(() => import('./pages/admin/AdminModulePage.jsx'))
const AdminRewardScanner = lazy(() => import('./pages/admin/AdminRewardScanner.jsx'))
const AdminRewardsManager = lazy(() => import('./pages/admin/AdminRewardsManager.jsx'))
const AdminDiagnostics = lazy(() => import('./pages/admin/AdminDiagnostics.jsx'))
const AdminBookingSettings = lazy(() => import('./pages/admin/AdminBookingSettings.jsx'))
const AdminBookingsV2 = lazy(() => import('./pages/admin/AdminBookingsV2.jsx'))

function ScrollToTop() {
  const { pathname } = useLocation()
  const { trackPageView } = useAnalytics()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    // Track page view on route change
    const pageTitle = document.title || 'Remote Control Cafe'
    trackPageView(pathname, pageTitle)
  }, [pathname, trackPageView])

  return null
}

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <AdminAuthProvider>
    <div className={`min-h-screen overflow-x-hidden text-charcoal-300 ${isAdmin ? 'bg-[#f6f6f4]' : 'bg-white'}`}>
      {/* Site-wide structured data + analytics (analytics only injects with real IDs) */}
      <SEO schema={[organizationSchema(), websiteSchema(), localBusinessSchema()]} />
      <Analytics />
      {!isAdmin && <Loader />}
      <ScrollToTop />
      {!isAdmin && <Header />}
      <main className={isAdmin ? '' : 'pt-24'}>
        <Suspense fallback={<div className="min-h-[60vh]" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/why-rcc-cafe" element={<WhyRCC />} />
          <Route path="/birthday-packages" element={<BirthdayPackages />} />
          <Route path="/corporate-packages" element={<CorporatePackages />} />
          <Route path="/group-booking-packages" element={<GroupBookingPackages />} />
          <Route path="/school-holiday-packages" element={<SchoolHolidayPackages />} />
          <Route path="/machines" element={<Machines />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/rewards/card/:token" element={<RewardCard />} />
          <Route path="/reward-card" element={<RewardCard />} />
          <Route path="/staff-rewards" element={<Navigate to="/admin/rewards/scanner" replace />} />
          <Route path="/staff/rewards" element={<Navigate to="/admin/rewards/scanner" replace />} />
          <Route path="/admin-rewards" element={<Navigate to="/admin/rewards" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={(
              <ProtectedAdminRoute roles={['super_admin', 'admin', 'manager', 'staff']}>
                <AdminLayout />
              </ProtectedAdminRoute>
            )}
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminBookingsV2 />} />
            <Route path="customers" element={<ProtectedAdminRoute roles={['super_admin', 'admin', 'manager']}><AdminModulePage moduleKey="customers" /></ProtectedAdminRoute>} />
            <Route path="rewards" element={<ProtectedAdminRoute roles={['super_admin', 'admin', 'manager']}><AdminRewardsManager /></ProtectedAdminRoute>} />
            <Route path="rewards/scanner" element={<AdminRewardScanner />} />
            <Route path="offers" element={<ProtectedAdminRoute roles={['super_admin', 'admin', 'manager']}><AdminModulePage moduleKey="offers" /></ProtectedAdminRoute>} />
            <Route path="packages" element={<ProtectedAdminRoute roles={['super_admin', 'admin', 'manager']}><AdminModulePage moduleKey="packages" /></ProtectedAdminRoute>} />
            <Route path="menu" element={<ProtectedAdminRoute roles={['super_admin', 'admin', 'manager']}><AdminModulePage moduleKey="menu" /></ProtectedAdminRoute>} />
            <Route path="media" element={<ProtectedAdminRoute roles={['super_admin', 'admin', 'manager']}><AdminModulePage moduleKey="media" /></ProtectedAdminRoute>} />
            <Route path="content" element={<ProtectedAdminRoute roles={['super_admin', 'admin', 'manager']}><AdminModulePage moduleKey="content" /></ProtectedAdminRoute>} />
            <Route path="seo" element={<ProtectedAdminRoute roles={['super_admin', 'admin', 'manager']}><AdminModulePage moduleKey="seo" /></ProtectedAdminRoute>} />
            <Route path="leads" element={<ProtectedAdminRoute roles={['super_admin', 'admin', 'manager']}><AdminModulePage moduleKey="leads" /></ProtectedAdminRoute>} />
            <Route path="settings/booking" element={<ProtectedAdminRoute roles={['super_admin']}><AdminBookingSettings /></ProtectedAdminRoute>} />
            <Route path="settings" element={<ProtectedAdminRoute roles={['super_admin']}><AdminModulePage moduleKey="settings" /></ProtectedAdminRoute>} />
            <Route path="users" element={<ProtectedAdminRoute roles={['super_admin']}><AdminModulePage moduleKey="users" /></ProtectedAdminRoute>} />
            <Route path="diagnostics" element={<ProtectedAdminRoute roles={['super_admin', 'admin']}><AdminDiagnostics /></ProtectedAdminRoute>} />
          </Route>

          {/* Local SEO landing pages */}
          {LANDING_PAGES.map((page) => (
            <Route key={page.slug} path={`/${page.slug}`} element={<LandingPage />} />
          ))}

          {/* Blog / resources */}
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

          {/* FAQ hub */}
          <Route path="/faq" element={<FAQ />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      {!isAdmin && <Footer />}
    </div>
    </AdminAuthProvider>
  )
}
