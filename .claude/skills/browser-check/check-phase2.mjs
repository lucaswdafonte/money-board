// One-off visual smoke check for the Phase 2 Portfolio & Asset Registry flow.
// Requires the app stack already running (docker compose up -d) at FRONTEND_URL.
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { chromium } from 'playwright'

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'
const SCREENSHOT_DIR = fileURLToPath(new URL('./screenshots-phase2/', import.meta.url))
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

const email = `phase2check+${Date.now()}@example.com`
const password = 'supersecret1'

try {
  // Register a fresh user, lands on the dashboard.
  await page.goto(`${FRONTEND_URL}/register`)
  await page.fill('input[type=email]', email)
  await page.fill('input[type=password]', password)
  await page.click('button[type=submit]')
  await page.waitForSelector('text=Dashboard')
  await shot(page, 'dashboard')

  // Navigate to Portfolios via the nav link.
  await page.click('a:has-text("Portfolios")')
  await page.waitForURL('**/portfolios')
  await page.waitForSelector('text=You don\'t have any portfolios yet')
  await shot(page, 'portfolios-empty')

  // Create a portfolio.
  await page.fill('input[placeholder="Portfolio name"]', 'Test Portfolio')
  await page.click('button:has-text("Create portfolio")')
  await page.waitForSelector('a:has-text("Test Portfolio")')
  await shot(page, 'portfolios-list-with-one')

  // Go into the portfolio detail page.
  await page.click('a:has-text("Test Portfolio")')
  await page.waitForSelector('h1:has-text("Test Portfolio")')
  await page.waitForSelector('text=No assets registered yet')
  await shot(page, 'portfolio-detail-empty')

  // Add an asset.
  await page.click('button:has-text("Add asset")')
  await page.waitForSelector('.asset-form')
  const form = page.locator('.asset-form')
  await form.locator('label:has-text("Ticker") input').fill('PETR4')
  await form.locator('label:has-text("Name") input').fill('Petrobras PN')
  await form.locator('label:has-text("Asset class") select').selectOption('stock')
  await form.locator('label:has-text("Sector") input').fill('Energy')
  await form.locator('label:has-text("Country") input').fill('Brazil')
  await form.locator('label:has-text("Currency") input').fill('BRL')
  await page.click('button:has-text("Add asset")')
  await page.waitForSelector('td:has-text("PETR4")')
  await shot(page, 'asset-added')

  // Edit the asset's name.
  await page.click('tr:has-text("PETR4") button:has-text("Edit")')
  await page.waitForSelector('.asset-form')
  const editForm = page.locator('.asset-form')
  await editForm.locator('label:has-text("Name") input').fill('Petrobras PN Renamed')
  await page.click('button:has-text("Save changes")')
  await page.waitForSelector('td:has-text("Petrobras PN Renamed")')
  await shot(page, 'asset-edited')

  // Delete the asset.
  await page.click('tr:has-text("PETR4") button:has-text("Delete")')
  await page.waitForSelector('text=No assets registered yet')
  await shot(page, 'asset-deleted')

  console.log(`OK — screenshots in ${SCREENSHOT_DIR}`)
} finally {
  await browser.close()
}

if (consoleErrors.length > 0) {
  console.error('Console errors during the run:')
  for (const err of consoleErrors) console.error(` - ${err}`)
  process.exit(1)
}
