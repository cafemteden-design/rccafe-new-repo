const debuggerPort = Number(process.env.CHROME_DEBUG_PORT || 9224)
const targetUrl = process.env.BOOKING_QA_URL || 'http://127.0.0.1:4180/booking'
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
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || 'Browser evaluation failed.')
  return result.result.value
}
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
  console.log(`PASS: ${message}`)
}

await send('Page.enable')
await send('Runtime.enable')
await wait(900)
await evaluate("sessionStorage.setItem('__rccafe_loaded', '1'); location.reload(); true")
await wait(1400)
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })

const clickText = (selector, text) => evaluate(`(() => { const item = [...document.querySelectorAll(${JSON.stringify(selector)})].find((node) => node.textContent.trim().includes(${JSON.stringify(text)}) && !node.disabled); if (!item) return false; item.click(); return true })()`)
const bodyHas = (text) => evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`)

assert(await evaluate(`(() => { const item = [...document.querySelectorAll('button')].find((node) => /^\\d{1,2}$/.test(node.textContent.trim()) && !node.disabled); if (!item) return false; item.click(); return true })()`), 'Selectable date opens slot step')
await wait(700)
assert(await clickText('button', '09:00 AM'), 'Hourly slot can be selected')
await wait(250)
assert(await evaluate(`(() => { const item = document.querySelector('button[aria-label="3 remotes"]'); if (!item) return false; item.click(); return true })()`), 'Three remotes can be selected')
await wait(250)
assert(await clickText('button', '45 Minutes'), '45-minute gameplay can be selected')
await wait(250)
assert(await clickText('button', 'Ham & Cheese'), 'Toastie choice remains selectable')
assert(await clickText('button', 'Any Black'), 'Coffee choice remains selectable')
assert(await clickText('button', 'Continue'), 'Food selections continue to customer details')
await wait(250)

await evaluate(`(() => { const inputs = [...document.querySelectorAll('input')]; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; [['RCC QA User', inputs[0]], ['qa@example.com', inputs[1]], ['0210000000', inputs[2]]].forEach(([value, input]) => { set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })) }); return true })()`)
assert(await bodyHas('3 x $45 per remote'), 'Initial total is 3 x $45')
assert(await evaluate(`(() => { const item = document.querySelector('button[aria-label="Increase remotes"]'); if (!item) return false; item.click(); return true })()`), 'Remote count increases without leaving details')
await wait(200)
assert(await bodyHas('4 x $45 per remote'), 'Increasing remotes recalculates total to $180')
assert(await evaluate(`(() => { const item = document.querySelector('button[aria-label="Decrease remotes"]'); if (!item) return false; item.click(); return true })()`), 'Remote count decreases without leaving details')
await wait(200)
assert(await bodyHas('3 x $45 per remote'), 'Decreasing remotes restores total to $135')
assert(await clickText('button', 'Remotes Edit'), 'Remote editor opens from customer details')
await wait(150)
assert(await evaluate(`Boolean(document.querySelector('[role="dialog"]'))`), 'Remote editor modal is visible')
assert(await evaluate(`(() => { const dialog = document.querySelector('[role="dialog"]'); const item = [...dialog.querySelectorAll('button')].find((node) => node.textContent.trim() === '4'); item?.click(); return Boolean(item) })()`), 'Remote editor changes selection to four')
await wait(200)
assert(await bodyHas('4 x $45 per remote'), 'Modal edit recalculates total instantly')

assert(await clickText('button', 'Gameplay'), 'Completed progress step can reopen gameplay')
await wait(150)
assert(await clickText('button', '60 Minutes'), '60-minute gameplay can be selected')
await wait(150)
assert(await clickText('button', 'Continue'), 'Preserved food choices continue after duration edit')
await wait(200)
assert(await bodyHas('4 x $55 per remote'), '60-minute total recalculates to $220')
assert(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Desktop has no horizontal page overflow')

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true })
await wait(250)
assert(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`), 'Mobile has no horizontal page overflow')
const mobileSummaryState = await evaluate(`(() => { const item = [...document.querySelectorAll('button[aria-expanded]')].find((node) => node.textContent.includes('Booking Summary')); return item?.getAttribute('aria-expanded') || 'missing' })()`)
console.log(`INFO: mobile summary state on details = ${mobileSummaryState}`)
assert(mobileSummaryState === 'false', 'Mobile summary is collapsed on customer details')
assert(await clickText('button', 'Continue'), 'Customer details continue to review')
await wait(250)
assert(await evaluate(`document.querySelector('button[aria-expanded="true"]')?.textContent.includes('Booking Summary') === true`), 'Mobile summary auto-expands before submit')
assert(await bodyHas('4 x $55 per remote'), 'Mobile expanded summary keeps the correct total')

socket.close()
await fetch(`http://127.0.0.1:${debuggerPort}/json/close/${target.id}`)
