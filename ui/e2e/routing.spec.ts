import type L from 'leaflet'
import { test, expect } from '@playwright/test'

test.describe('ENStop PWA E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Expose the Leaflet map instance (Leaflet assigns window.L when it loads)
    await page.addInitScript(() => {
      let leaflet: typeof L
      Object.defineProperty(window, 'L', {
        configurable: true,
        get: () => leaflet,
        set: (value: typeof L) => {
          leaflet = value
          value.Map.addInitHook(function (this: L.Map) {
            ;(window as unknown as { __map: L.Map }).__map = this
          })
        },
      })
    })
    // Open the application locally (VITE dev server runs on 5173 by default)
    await page.goto('http://127.0.0.1:5173/')
  })

  test('should load the homepage with correct title and elements', async ({ page }) => {
    // Verify document title
    await expect(page).toHaveTitle('Rutas Ensenada — Guía de Transporte Público')

    // Verify main header
    const header = page.locator('header h1')
    await expect(header).toContainText('ENStop')

    // Verify Map container is visible
    const map = page.locator('.leaflet-container')
    await expect(map).toBeVisible()
  })

  test('should allow selecting stops and performing routing calculations', async ({ page }) => {
    // Type in origin and select the first stop from the dropdown
    const originInput = page.locator('#origin-input')
    await originInput.fill('Terminal Centro')

    // Select option from autocomplete list
    const firstOriginOption = page.locator('button:has-text("Terminal Centro")')
    await firstOriginOption.click()

    // Type in destination and select the first stop from the dropdown
    const destInput = page.locator('#dest-input')
    await destInput.fill('Terminal Chapultepec')

    // Select option from autocomplete list
    const firstDestOption = page.locator('button:has-text("Terminal Chapultepec")')
    await firstDestOption.click()

    // Verify Route Recommendation lists appear automatically
    const resultsHeader = page.locator('h3:has-text("Rutas recomendadas")')
    await expect(resultsHeader).toBeVisible()

    // Verify at least one result card is present
    const firstResult = page.locator('span:has-text("R1")').first()
    await expect(firstResult).toBeVisible()
  })

  test('should open drawer when stop marker is selected', async ({ page }) => {
    // Below street zoom stops are canvas dots with no DOM node, so click the stop's
    // position on the map: zoom to Terminal Centro and click the map center.
    await page.waitForFunction(() => (window as unknown as { __map?: unknown }).__map)
    await page.evaluate(() => {
      const map = (window as unknown as { __map: L.Map }).__map
      map.setView([31.869517, -116.617893], 16, { animate: false })
    })
    const marker = page.locator('.custom-stop-marker').first()
    await expect(marker).toBeVisible()

    // Click stop marker
    const box = (await page.locator('.leaflet-container').boundingBox())!
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)

    // Verify details drawer appears
    const drawerTitle = page.locator('h3:has-text("Terminal Centro")')
    await expect(drawerTitle).toBeVisible()

    // Verify check-in button is visible
    const checkInBtn = page.locator('button:has-text("Estoy en esta parada")')
    await expect(checkInBtn).toBeVisible()
  })
})
