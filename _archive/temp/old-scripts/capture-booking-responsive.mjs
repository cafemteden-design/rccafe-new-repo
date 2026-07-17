import fs from 'node:fs/promises'
import path from 'node:path'

const debuggerPort = Number(process.env.CHROME_DEBUG_PORT || 9223)
const targetUrl = process.env.BOOKING_QA_URL || 'http://127.0.0.1:4180/booking'
const outputDir = path.resolve('qa-screenshots')
const viewports = [
  { name: '320', width: 320, height: 900 },
  { name: '375', width: 375, height: 900 },
  { name: '390', width: 390, height: 900 },
  { name: '414', width: 414, height: 900 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 1000 }
]

await fs.mkdir(outputDir, { recursive: true })
const target = await fetch(`http://127.0.0.1:${debuggerPort}/json/new?${encodeURIComponent(targetUrl)}`, { method: 'PUT' }).then((response) => response.json())
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
  const { resolve, reject } = pending.get(message.id)
  pending.delete(message.id)
  if (message.error) reject(new Error(message.error.message))
  else resolve(message.result)
})

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId
  pending.set(id, { resolve, reject })
  socket.send(JSON.stringify({ id, method, params }))
})

await send('Page.enable')
await send('Runtime.enable')
await new Promise((resolve) => setTimeout(resolve, 900))
await send('Runtime.evaluate', { expression: "sessionStorage.setItem('__rccafe_loaded', '1'); location.reload()" })
await new Promise((resolve) => setTimeout(resolve, 1500))

for (const viewport of viewports) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width < 768
  })
  await new Promise((resolve) => setTimeout(resolve, 250))
  const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true })
  await fs.writeFile(path.join(outputDir, `booking-${viewport.name}.png`), Buffer.from(result.data, 'base64'))
}

socket.close()
await fetch(`http://127.0.0.1:${debuggerPort}/json/close/${target.id}`)
