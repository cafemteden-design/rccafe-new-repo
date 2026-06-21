import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Gift, PartyPopper, QrCode, ScanLine, Search, Stamp, Undo2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'
import { AdminAlert, AdminEmpty, AdminModal, AdminPageHeader } from '../../components/admin/AdminUI.jsx'
import { useToast } from '../../components/admin/ToastContext.jsx'

export default function AdminRewardScanner() {
  const toast = useToast()
  const [cardId, setCardId] = useState('')
  const [card, setCard] = useState(null)
  const [message, setMessage] = useState(null)
  const [working, setWorking] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [stampCount, setStampCount] = useState(1)
  const [note, setNote] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const scannerRef = useRef(null)

  useEffect(() => () => {
    scannerRef.current?.stop?.().catch(() => {})
  }, [])

  const loadCard = async (rawValue) => {
    const value = rawValue.trim()
    let token = ''
    try {
      const url = new URL(value)
      token = url.pathname.match(/\/rewards\/card\/([^/]+)/)?.[1] || ''
    } catch {
      token = ''
    }
    const normalized = value.toUpperCase().replace(/[\s-]/g, '')
    const query = token
      ? supabase.from('reward_cards').select('*').eq('secure_token', token)
      : supabase.from('reward_cards').select('*').eq('rcc_card_id', normalized)
    const { data, error } = await query.maybeSingle()
    if (error || !data) {
      setCard(null)
      setMessage({ type: 'error', text: error?.message || 'Reward card not found.' })
    } else {
      setCard(data)
      setCardId(data.rcc_card_id)
      setMessage({ type: 'success', text: `${data.rcc_card_id} loaded securely.` })
    }
  }

  const findCard = async (event) => {
    event?.preventDefault()
    setMessage(null)
    if (!cardId.trim()) {
      setMessage({ type: 'error', text: 'Enter or scan an RCC Card ID.' })
      return
    }
    setWorking(true)
    await loadCard(cardId)
    setWorking(false)
  }

  const startScanner = async () => {
    setMessage(null)
    setScanning(true)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('rcc-admin-qr-reader')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          await scanner.stop()
          scanner.clear()
          scannerRef.current = null
          setScanning(false)
          setWorking(true)
          await loadCard(decodedText)
          setWorking(false)
        },
        () => {}
      )
    } catch (scanError) {
      setScanning(false)
      setMessage({ type: 'error', text: scanError.message || 'Camera access is unavailable. Use Card ID lookup instead.' })
    }
  }

  const stopScanner = async () => {
    await scannerRef.current?.stop?.().catch(() => {})
    scannerRef.current?.clear?.()
    scannerRef.current = null
    setScanning(false)
  }

  const addStamp = async () => {
    setWorking(true)
    const { data, error } = await supabase.rpc('add_reward_stamp', {
      p_reward_card_id: card.id,
      p_stamp_count: Number(stampCount) || 1,
      p_note: note.trim() || 'Added from admin scanner'
    })
    if (error) toast.error(error.message)
    else {
      setCard((current) => ({ ...current, ...data }))
      setNote('')
      setStampCount(1)
      toast.success(data.reward_status === 'unlocked' ? 'Reward target reached. Gift unlocked!' : `${Number(stampCount) || 1} stamp(s) added.`)
    }
    setWorking(false)
  }

  const removeStamp = async () => {
    setConfirmRemove(false)
    setWorking(true)
    const { data, error } = await supabase.rpc('undo_last_reward_stamp', {
      p_reward_card_id: card.id,
      p_note: note.trim() || 'Removed accidental stamp'
    })
    if (error) toast.error(error.message)
    else {
      setCard((current) => ({ ...current, ...data }))
      setNote('')
      toast.success('Last stamp removed.')
    }
    setWorking(false)
  }

  const redeem = async () => {
    setWorking(true)
    const { data, error } = await supabase.rpc('redeem_reward', {
      p_reward_card_id: card.id,
      p_note: note.trim() || 'Redeemed from admin scanner'
    })
    if (error) toast.error(error.message)
    else {
      setCard((current) => ({ ...current, ...data }))
      setNote('')
      toast.success('Reward redeemed and a new cycle started.')
    }
    setWorking(false)
  }

  const redeemWelcomeGift = async () => {
    setWorking(true)
    const { data, error } = await supabase.rpc('redeem_welcome_gift', {
      p_reward_card_id: card.id,
      p_note: note.trim() || 'Welcome gift redeemed from admin scanner'
    })
    if (error) toast.error(error.message)
    else {
      setCard((current) => ({ ...current, ...data }))
      setNote('')
      toast.success('Welcome gift redeemed.')
    }
    setWorking(false)
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Staff Tool" title="Reward Scanner" description="Scan a customer QR or enter their RCC Card ID to add stamps and redeem gifts." />
      <div className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-5 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-orange-600 shadow-soft"><QrCode size={29} /></div>
            <h2 className="mt-4 font-display text-xl font-extrabold">Camera Scanner</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Use the rear camera to scan the secure QR shown on a customer reward card.</p>
            <div id="rcc-admin-qr-reader" className={`mx-auto mt-4 overflow-hidden rounded-xl bg-white ${scanning ? 'min-h-64' : 'h-0'}`} />
            <button type="button" className="btn-outline mt-5 w-full" onClick={scanning ? stopScanner : startScanner}>
              <ScanLine size={17} />{scanning ? 'Stop Scanner' : 'Open Scanner'}
            </button>
          </div>
          <form onSubmit={findCard} className="mt-5">
            <label className="field-label">RCC Card ID</label>
            <div className="mt-1.5 flex gap-2">
              <input value={cardId} onChange={(event) => setCardId(event.target.value)} className="field-input !mt-0 uppercase" placeholder="RCC1001" />
              <button disabled={working} className="grid h-11 w-12 flex-shrink-0 place-items-center rounded-xl bg-charcoal-300 text-white disabled:opacity-50" aria-label="Find reward card"><Search size={18} /></button>
            </div>
          </form>
          {message && <div className="mt-4"><AdminAlert type={message.type}>{message.text}</AdminAlert></div>}
        </section>

        {card ? (
          <section className="rounded-2xl border border-orange-200 bg-white p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Customer Reward Card</div>
                <h2 className="mt-2 font-display text-2xl font-extrabold">{card.full_name || card.rcc_card_id}</h2>
                <p className="mt-1 text-sm text-muted">{card.rcc_card_id} · Cycle {card.cycle_number}</p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${card.reward_status === 'unlocked' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{card.reward_status === 'unlocked' ? 'Gift Unlocked' : 'Active Card'}</span>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className={`grid aspect-square place-items-center rounded-xl border text-xs font-extrabold ${index < card.current_stamps ? 'border-orange-500 bg-orange-500 text-white' : index === 6 ? 'border-green-300 bg-green-50 text-green-700' : 'border-border bg-bg-soft text-muted'}`}>
                  {index === 6 ? <Gift size={16} /> : index < card.current_stamps ? <BadgeCheck size={17} /> : index + 1}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-bg-soft p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-muted">Progress</div>
              <div className="mt-1 font-display text-3xl font-extrabold">{card.current_stamps}/7</div>
            </div>
            {card.welcome_gift_unlocked && !card.welcome_gift_redeemed && (
              <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
                <div className="flex items-center gap-2 text-sm font-bold text-green-800"><PartyPopper size={17} />Welcome gift available</div>
                <button type="button" disabled={working} onClick={redeemWelcomeGift} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-green-600 px-4 text-xs font-bold text-white disabled:opacity-50">Redeem</button>
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Stamps to add</span>
                <input type="number" min="1" max="7" value={stampCount} onChange={(event) => setStampCount(event.target.value)} className="field-input" />
              </label>
              <label className="block">
                <span className="field-label">Note (optional)</span>
                <input type="text" value={note} onChange={(event) => setNote(event.target.value)} className="field-input" placeholder="e.g. Birthday visit" />
              </label>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button type="button" disabled={working || card.reward_status === 'unlocked'} onClick={addStamp} className="btn-primary min-h-12 disabled:opacity-50"><Stamp size={17} />Add Stamp{Number(stampCount) > 1 ? `s (${stampCount})` : ''}</button>
              <button type="button" disabled={working || card.reward_status !== 'unlocked'} onClick={redeem} className="btn-outline min-h-12 disabled:opacity-50"><Gift size={17} />Redeem Gift</button>
            </div>
            <button type="button" disabled={working || card.current_stamps <= 0} onClick={() => setConfirmRemove(true)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-red-200 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-40"><Undo2 size={16} />Remove Last Stamp</button>
            <p className="mt-4 text-xs leading-relaxed text-muted">Multiple eligible stamps can be recorded on the same day. Every action - including stamp removals - is saved to reward_events with the staff user ID. History is never deleted.</p>
          </section>
        ) : (
          <AdminEmpty icon={QrCode} title="Ready to scan" description="Load a customer reward card to view progress and available staff actions." />
        )}
      </div>

      {confirmRemove && card && (
        <AdminModal
          title="Remove last stamp?"
          description={`${card.rcc_card_id} · currently ${card.current_stamps}/7 stamps`}
          onClose={() => setConfirmRemove(false)}
          footer={(
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setConfirmRemove(false)}>Cancel</button>
              <button type="button" disabled={working} onClick={removeStamp} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-bold text-white disabled:opacity-50"><Undo2 size={16} />Remove Stamp</button>
            </div>
          )}
        >
          <p className="text-sm leading-relaxed text-muted">Remove the last stamp from this customer card? Use this only to correct a stamp added by mistake. The removal is logged to the card history and cannot itself be undone.</p>
          <label className="mt-4 block">
            <span className="field-label">Reason / note</span>
            <input type="text" value={note} onChange={(event) => setNote(event.target.value)} className="field-input" placeholder="Removed accidental stamp" />
          </label>
        </AdminModal>
      )}
    </div>
  )
}
