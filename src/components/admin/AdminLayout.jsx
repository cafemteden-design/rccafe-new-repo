import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ChevronRight, LogOut, Menu, PanelLeftClose, X } from 'lucide-react'
import Logo from '../Logo.jsx'
import { ADMIN_NAV, MOBILE_ADMIN_NAV, ROLE_LABELS } from '../../admin/adminConfig.js'
import { useAdminAuth } from '../../admin/AdminAuthContext.jsx'
import { ToastProvider } from './ToastContext.jsx'

export default function AdminLayout() {
  return (
    <ToastProvider>
      <AdminLayoutInner />
    </ToastProvider>
  )
}

function AdminLayoutInner() {
  const { role, profile, user, signOut } = useAdminAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigation = useMemo(() => ADMIN_NAV.filter((item) => item.roles.includes(role)), [role])
  const mobileNavigation = MOBILE_ADMIN_NAV.filter((item) => item.roles.includes(role))

  return (
    <div className="min-h-screen bg-[#f6f6f4] text-charcoal-300">
      <aside className={`fixed inset-y-0 left-0 z-50 hidden border-r border-border bg-white transition-all duration-200 lg:flex lg:flex-col ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex h-20 items-center justify-between border-b border-border px-4">
          <Link to="/admin/dashboard" className="overflow-hidden">
            <Logo className={`h-12 w-auto ${collapsed ? 'max-w-12 object-cover object-left' : 'max-w-[150px]'}`} />
          </Link>
          {!collapsed && (
            <button type="button" onClick={() => setCollapsed(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted" aria-label="Collapse sidebar">
              <PanelLeftClose size={17} />
            </button>
          )}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map((item) => <AdminNavItem key={item.to} item={item} collapsed={collapsed} />)}
        </nav>
        <div className="border-t border-border p-3">
          {collapsed ? (
            <button type="button" onClick={() => setCollapsed(false)} className="grid h-11 w-full place-items-center rounded-xl bg-orange-50 text-orange-700" aria-label="Expand sidebar">
              <ChevronRight size={19} />
            </button>
          ) : (
            <>
              <div className="rounded-xl bg-bg-soft p-3">
                <div className="truncate text-sm font-extrabold">{profile?.full_name || user?.email}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-orange-700">{ROLE_LABELS[role]}</div>
              </div>
              <button type="button" onClick={signOut} className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-muted transition hover:bg-red-50 hover:text-red-700">
                <LogOut size={17} />Sign Out
              </button>
            </>
          )}
        </div>
      </aside>

      <div className={`min-h-screen transition-all duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur sm:px-6 lg:h-20">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">RCC Operations</div>
            <div className="mt-0.5 text-sm font-bold text-charcoal-300">{getCurrentLabel(location.pathname, navigation)}</div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted sm:inline-flex">View Website</Link>
            <button type="button" onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-white lg:hidden" aria-label="Open admin menu">
              <Menu size={19} />
            </button>
          </div>
        </header>

        <main className="p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">
          <Outlet />
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {mobileNavigation.map((item) => <MobileNavItem key={item.to} item={item} />)}
        <button type="button" onClick={() => setMobileOpen(true)} className="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold text-muted">
          <Menu size={20} />More
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] bg-white lg:hidden">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Logo className="h-12 w-auto max-w-[140px]" />
            <button type="button" onClick={() => setMobileOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg border border-border" aria-label="Close admin menu">
              <X size={20} />
            </button>
          </div>
          <nav className="h-[calc(100dvh-4rem)] overflow-y-auto p-4 pb-10">
            <div className="grid gap-2">
              {navigation.map((item) => (
                <AdminNavItem key={item.to} item={item} onClick={() => setMobileOpen(false)} />
              ))}
            </div>
            <button type="button" onClick={signOut} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 font-bold text-red-700">
              <LogOut size={17} />Sign Out
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}

function AdminNavItem({ item, collapsed = false, onClick }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) => `flex min-h-11 items-center rounded-xl font-bold transition ${
        collapsed ? 'justify-center px-2' : 'gap-3 px-3'
      } ${isActive ? 'bg-orange-500 text-white shadow-sm' : 'text-muted hover:bg-orange-50 hover:text-orange-700'}`
      }
    >
      <Icon size={18} className="flex-shrink-0" />
      {!collapsed && <span className="text-sm">{item.label}</span>}
    </NavLink>
  )
}

function MobileNavItem({ item }) {
  const Icon = item.icon
  return (
    <NavLink to={item.to} className={({ isActive }) => `flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold ${isActive ? 'text-orange-600' : 'text-muted'}`}>
      <Icon size={20} />{item.label}
    </NavLink>
  )
}

function getCurrentLabel(pathname, navigation) {
  return [...navigation]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))?.label || 'Admin'
}
