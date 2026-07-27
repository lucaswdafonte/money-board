// One-off visual smoke check for the money-board frontend auth flow.
// Requires the app stack already running (docker compose up -d) at FRONTEND_URL.
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { chromium } from 'playwright'

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'
const SCREENSHOT_DIR = fileURLToPath(new URL('./screenshots/', import.meta.url))
mkdirSync(SCREENSHOT_DIR, { recursive: true })

const consoleErrors = []
let step = 0

function shot(page, name) {
  step += 1
  return page.screenshot({ path: join(SCREENSHOT_DIR, `${String(step).padStart(2, '0')}-${name}.png`) })
}

const browser = await chromium.launch()
const page = await browser.newPage()
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => consoleErrors.push(String(err)))

const email = `browsercheck+${Date.now()}@example.com`
const password = 'supersecret1'

try {
  // Logged-out root should redirect to /login.
  await page.goto(FRONTEND_URL)
  await page.waitForURL('**/login')
  await page.waitForSelector('input[type=email]')
  await shot(page, 'login-redirect')

  // Register a fresh user, should land on the dashboard.
  await page.goto(`${FRONTEND_URL}/register`)
  await page.fill('input[type=email]', email)
  await page.fill('input[type=password]', password)
  await page.click('button[type=submit]')
  await page.waitForSelector('text=Dashboard')
  await page.waitForSelector(`text=${email}`)
  await shot(page, 'dashboard-after-register')

  // Log out, should return to /login.
  await page.click('button:has-text("Log out")')
  await page.waitForURL('**/login')
  await page.waitForSelector('input[type=email]')
  await shot(page, 'after-logout')

  // Log back in with the same credentials.
  await page.fill('input[type=email]', email)
  await page.fill('input[type=password]', password)
  await page.click('button[type=submit]')
  await page.waitForSelector('text=Dashboard')
  await shot(page, 'dashboard-after-relogin')

  console.log(`OK — screenshots in ${SCREENSHOT_DIR}`)
} finally {
  await browser.close()
}

if (consoleErrors.length > 0) {
  console.error('Console errors during the run:')
  for (const err of consoleErrors) console.error(` - ${err}`)
  process.exit(1)
}
