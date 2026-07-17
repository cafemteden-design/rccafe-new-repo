import { useEffect, useMemo, useState } from 'react'

export default function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [showGuide, setShowGuide] = useState(false)
  const isIOS = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return /iphone|ipad|ipod/i.test(navigator.userAgent)
  }, [])

  useEffect(() => {
    const capturePrompt = (event) => {
      event.preventDefault()
      setPromptEvent(event)
    }
    window.addEventListener('beforeinstallprompt', capturePrompt)
    return () => window.removeEventListener('beforeinstallprompt', capturePrompt)
  }, [])

  const requestInstall = async () => {
    // Browsers require a customer gesture and confirmation; unsupported browsers get clear manual instructions.
    if (promptEvent) {
      try {
        await promptEvent.prompt()
        await promptEvent.userChoice
        setPromptEvent(null)
        return
      } catch {
        setPromptEvent(null)
        setShowGuide(true)
        return
      }
    }
    setShowGuide(true)
  }

  return {
    canInstall: Boolean(promptEvent),
    isIOS,
    showGuide,
    setShowGuide,
    requestInstall
  }
}
