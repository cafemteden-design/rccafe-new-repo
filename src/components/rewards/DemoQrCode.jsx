import { QRCodeSVG } from 'qrcode.react'

export default function DemoQrCode({ value, label = 'Card QR', premium = false, compact = false }) {
  return (
    <div className={`${compact ? 'rounded-2xl p-2' : 'rounded-3xl p-3'} border shadow-soft ${premium ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-white' : 'border-border bg-white'}`}>
      <div className={`${compact ? 'rounded-xl p-1.5' : 'rounded-2xl p-2'} border border-orange-100 bg-white`}>
        <QRCodeSVG
          value={String(value || 'https://remotecontrolcafe.co.nz/rewards')}
          size={compact ? 82 : 164}
          level="M"
          marginSize={1}
          bgColor="#ffffff"
          fgColor="#151515"
          className="h-auto w-full"
          aria-label={label}
        />
      </div>
      <div className={`${compact ? 'mt-1.5' : 'mt-3'} text-center`}>
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-700">{label}</div>
        {!compact && <div className="mt-1 text-[10px] font-semibold text-muted">Show at RCC counter</div>}
      </div>
    </div>
  )
}
