import fs from 'node:fs/promises'
import path from 'node:path'

const debuggerPort = Number(process.env.CHROME_DEBUG_PORT || 9226)
const baseUrl = process.env.REWARDS_QA_URL || 'http://127.0.0.1:4180'
const outputDir = path.resolve('qa-screenshots')
const captures = [
  { page: 'rewards', path: '/rewards', name: 'rewards-mobile-390', width: 390, height: 1000 },
  { page: 'rewards', path: '/rewards', name: 'rewards-desktop-1440', width: 1440, height: 1000 },
  { page: 'dashboard', path: '/rewards/card/demo', name: 'reward-dashboard-mobile-390', width: 390, height: 1000 },
  { page: 'dashboard', path: '/rewards/card/demo', name: 'reward-dashboard-desktop-1440', width: 1440, height: 1000 }
]

await fs.mkdir(outputDir, { recursive: true })
const target = await fetch(`http://127.0.0.1:${debuggerPort}/json/new?${encodeURIComponent(`${baseUrl}/rewards`)}`, { method: 'PUT' }).then((response) => response.json())
const socket = new WebSocket(target.webSocketDebuggerUrl)
const pending = new Map()
let nextId = 0

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (!message.id || !pending.has(message.id)) return
  const handler = pending.get(message.id)
  pending.delete(message.id)
  if (message.error) handler.reject(new Error(message.error.message))
  else handler.resolve(message.result)
})
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId
  pending.set(id, { resolve, reject })
  socket.send(JSON.stringify({ id, method, params }))
})
const wait = (milliseconds = 250) => new Promise((resolve) => setTimeout(resolve, milliseconds))

await send('Page.enable')
await send('Runtime.enable')
await wait(700)
await send('Runtime.evaluate', { expression: "(async () => { sessionStorage.setItem('__rccafe_loaded', '1'); if ('serviceWorker' in navigator) { const registrations = await navigator.serviceWorker.getRegistrations(); await Promise.all(registrations.map((registration) => registration.unregister())) } if ('caches' in window) { const keys = await caches.keys(); await Promise.all(keys.map((key) => caches.delete(key))) } return true })()", awaitPromise: true })

for (const capture of captures) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: capture.width,
    height: capture.height,
    deviceScaleFactor: 1,
    mobile: capture.width < 768
  })
  await send('Page.navigate', { url: `${baseUrl}${capture.path}` })
  await wait(1100)
  const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true })
  await fs.writeFile(path.join(outputDir, `${capture.name}.png`), Buffer.from(result.data, 'base64'))
}

socket.close()
await fetch(`http://127.0.0.1:${debuggerPort}/json/close/${target.id}`)
