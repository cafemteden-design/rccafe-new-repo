const debuggerPort = Number(process.env.CHROME_DEBUG_PORT || 9225)
const baseUrl = process.env.REWARDS_QA_URL || 'http://127.0.0.1:4180'
const target = await fetch(`http://127.0.0.1:${debuggerPort}/json/new?${encodeURIComponent(`${baseUrl}/rewards`)}`, { method: 'PUT' }).then((response) => response.json())
const socket = new WebSocket(target.webSocketDebuggerUrl)
const pending = new Map()
const consoleErrors = []
let nextId = 0

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text)
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    consoleErrors.push(message.params.args.map((item) => item.value || item.description).join(' '))
  }
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
await evaluate("(async () => { sessionStorage.setItem('__rccafe_loaded', '1'); if ('serviceWorker' in navigator) { const registrations = await navigator.serviceWorker.getRegistrations(); await Promise.all(registrations.map((registration) => registration.unregister())) } if ('caches' in window) { const keys = await caches.keys(); await Promise.all(keys.map((key) => caches.delete(key))) } location.reload(); return true })()")
await wait(1400)
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })

assert(await evaluate("document.querySelector('h1')?.textContent.trim() === 'My Rewards'"), 'Rewards page is renamed to My Rewards')
assert(await evaluate("document.body.innerText.includes('Create New Reward Card') && document.body.innerText.includes('Open Existing Card')"), 'Create and open actions appear immediately')
assert(await evaluate("!document.body.innerText.includes('RCC Card ID')"), 'Legacy RCC Card ID login is removed')
assert(await evaluate("document.querySelector('#create-email')?.required === true && document.querySelector('#login-email')?.required === true"), 'Email is required for registration and login')
assert(await evaluate("document.querySelector('#create-dob')?.required === true && document.querySelector('#login-dob')?.required === true"), 'DOB is required for registration and login')
await evaluate("document.querySelector('#create-card form button[type=submit]').click()")
await wait(100)
assert(await evaluate("document.querySelector('#create-card [role=alert]')?.textContent.includes('full name') === true"), 'Empty registration is blocked with a friendly validation error')
assert(await evaluate("(() => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; const values = { '#create-name': 'RCC QA', '#create-phone': '0210000000', '#create-dob': '1990-01-01', '#create-email': 'invalid-email' }; Object.entries(values).forEach(([selector, value]) => { const input = document.querySelector(selector); set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })) }); document.querySelector('#create-card form button[type=submit]').click(); return true })()"), 'Invalid registration email is submitted only to frontend validation')
await wait(100)
assert(await evaluate("document.querySelector('#create-card [role=alert]')?.textContent.includes('valid email') === true"), 'Invalid email shows a friendly error without creating a card')
assert(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), 'Desktop rewards page has no horizontal overflow')

for (const width of [320, 375, 390, 414, 768]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: width === 768 ? 1024 : 900, deviceScaleFactor: 1, mobile: width < 768 })
  await wait(120)
  assert(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), `${width}px rewards page has no horizontal overflow`)
}

await send('Page.navigate', { url: `${baseUrl}/rewards/card/demo` })
await wait(1100)
assert(await evaluate("document.body.innerText.includes('My RCC Reward Card')"), 'Demo card opens the customer reward dashboard')
const dashboardSections = await evaluate("Object.fromEntries(['Stamp Progress', 'Quick Actions', 'Notifications & Offers', 'Current Offers', 'Visit History'].map((text) => [text, document.body.innerText.toLowerCase().includes(text.toLowerCase())]))")
assert(Object.values(dashboardSections).every(Boolean), `Dashboard contains all required daily-use sections (${JSON.stringify(dashboardSections)})`)
assert(await evaluate("['Save Card', 'Share on WhatsApp', 'Copy Card Link', 'Add to Home Screen'].every((text) => document.body.innerText.includes(text))"), 'All four quick card actions are available')
await evaluate("[...document.querySelectorAll('button')].find((item) => item.textContent.includes('Add to Home Screen')).click()")
await wait(150)
const installGuideVisible = await evaluate("document.querySelector('[role=dialog]')?.innerText.includes('Browsers do not allow automatic shortcut creation') === true")
assert(installGuideVisible || await evaluate("document.body.innerText.includes('Add to Home Screen')"), installGuideVisible ? 'Unsupported PWA install shows honest home-screen instructions' : 'Supported browser keeps the native PWA install path available')
if (installGuideVisible) await evaluate("document.querySelector('button[aria-label=\"Close home screen instructions\"]').click()")

for (const width of [320, 390, 768, 1440]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: width === 768 ? 1024 : 1000, deviceScaleFactor: 1, mobile: width < 768 })
  await wait(120)
  assert(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), `${width}px reward dashboard has no horizontal overflow`)
}

await send('Page.navigate', { url: `${baseUrl}/` })
await wait(1000)
assert(await evaluate("document.body.innerText.includes('Reward Card') && document.body.innerText.includes('Collect Stamps') && document.body.innerText.includes('Unlock Surprises')"), 'Homepage includes the compact My Rewards shortcut')
assert(await evaluate("[...document.querySelectorAll('a')].some((item) => item.textContent.includes('Create Card') && item.getAttribute('href') === '/rewards#create-card')"), 'Homepage Create Card CTA targets the registration action')
assert(await evaluate("['Instagram', 'Facebook', 'TikTok'].every((label) => Boolean(document.querySelector(`a[aria-label='${label}']`)))"), 'Homepage hero includes minimal social links')
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true })
await wait(150)
assert(await evaluate("(() => { const button = document.querySelector('button[aria-label=\"Open menu\"]'); button?.click(); return Boolean(button) })()"), 'Mobile navigation drawer opens')
await wait(200)
assert(await evaluate("[...document.querySelectorAll('nav[aria-label=\"Mobile navigation\"] a')].some((item) => item.textContent.includes('My Reward Card') && item.getAttribute('href') === '/rewards')"), 'Mobile menu includes My Reward Card')

await evaluate("localStorage.setItem('rcc_reward_remembered_session', JSON.stringify({ cardId: 'RCC1001', token: 'demo-saved-token', expiresAt: Date.now() + 60000 }))")
await send('Page.navigate', { url: `${baseUrl}/rewards` })
await wait(700)
assert(await evaluate("document.body.innerText.includes('Open My Saved Card')"), 'Rewards landing offers quick access to the card saved on this device')
await evaluate("localStorage.removeItem('rcc_reward_remembered_session')")

assert(consoleErrors.length === 0, `No runtime or console errors (${consoleErrors.join(' | ')})`)
socket.close()
await fetch(`http://127.0.0.1:${debuggerPort}/json/close/${target.id}`)
