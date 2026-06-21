import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info }
const STYLES = {
  success: 'border-green-200 bg-white text-green-800',
  error: 'border-red-200 bg-white text-red-800',
  info: 'border-orange-200 bg-white text-orange-800'
}
const ICON_TONE = { success: 'text-green-600', error: 'text-red-600', info: 'text-orange-500' }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback((type, message) => {
    const id = ++idRef.current
    setToasts((current) => [...current, { id, type, message }])
    setTimeout(() => dismiss(id), 4200)
  }, [dismiss])

  const toast = useMemo(() => ({
    success: (message) => push('success', message),
    error: (message) => push('error', message),
    info: (message) => push('info', message)
  }), [push])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[120] flex flex-col items-center gap-2 px-3 sm:bottom-4 sm:left-auto sm:right-4 sm:top-auto sm:items-end">
        {toasts.map((item) => {
          const Icon = ICONS[item.type] || Info
          return (
            <div
              key={item.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-card ${STYLES[item.type] || STYLES.info}`}
            >
              <Icon className={`mt-0.5 flex-shrink-0 ${ICON_TONE[item.type] || ICON_TONE.info}`} size={18} />
              <span className="min-w-0 flex-1 break-words">{item.message}</span>
              <button type="button" onClick={() => dismiss(item.id)} className="flex-shrink-0 text-muted hover:text-charcoal-300" aria-label="Dismiss">
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Safe no-op fallback so components never crash outside the provider.
    return { success: () => {}, error: () => {}, info: () => {} }
  }
  return context
}
