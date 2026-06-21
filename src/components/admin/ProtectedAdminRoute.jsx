import { Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAdminAuth } from '../../admin/AdminAuthContext.jsx'
import { AdminLoading } from './AdminUI.jsx'

export default function ProtectedAdminRoute({ roles, children }) {
  const auth = useAdminAuth()
  const location = useLocation()

  if (auth.loading) return <div className="min-h-screen bg-bg-soft p-6"><AdminLoading label="Checking admin access..." /></div>
  if (!auth.configured) return <AccessMessage title="Supabase setup required" text="Configure the approved VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values before using admin authentication." />
  if (!auth.user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  if (!auth.role) {
    return (
      <AccessMessage
        title="Admin role not assigned"
        text="Your login is valid, but this account does not have an active RCC admin role yet. Assign super_admin, admin, manager or staff in the profiles table, then refresh this page."
        email={auth.user.email}
        onSignOut={auth.signOut}
      />
    )
  }
  if (roles?.length && !roles.includes(auth.role)) return <AccessMessage title="Access restricted" text="Your current role does not have permission to open this module." />
  return children
}

function AccessMessage({ title, text, email, onSignOut }) {
  return (
    <div className="grid min-h-screen place-items-center bg-bg-soft p-5">
      <div className="max-w-lg rounded-2xl border border-orange-200 bg-white p-7 text-center shadow-card">
        <ShieldAlert className="mx-auto text-orange-600" size={38} />
        <h1 className="mt-4 font-display text-2xl font-extrabold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
        {email && <p className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-xs font-bold text-orange-900">{email}</p>}
        {onSignOut ? (
          <button type="button" onClick={onSignOut} className="btn-primary mt-6">Sign Out</button>
        ) : (
          <a href="/admin/login" className="btn-primary mt-6">Back to Admin Login</a>
        )}
      </div>
    </div>
  )
}
