import { test, expect } from '@playwright/test'

test.describe('ENStop PWA E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Open the application locally (VITE dev server runs on 5173 by default)
    await page.goto('http://localhost:5173/')
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
    const resultsHeader = page.locator('h3:has-text("Rutas Recomendadas:")')
    await expect(resultsHeader).toBeVisible()

    // Verify at least one result card is present
    const firstResult = page.locator('span:has-text("R1")').first()
    await expect(firstResult).toBeVisible()
  })

  test('should open drawer when stop marker is selected', async ({ page }) => {
    // Wait for stops markers to render. Stop markers have custom class .custom-stop-marker
    const marker = page.locator('.custom-stop-marker').first()
    await expect(marker).toBeVisible()

    // Click stop marker
    await marker.click()

    // Verify details drawer appears
    const drawerTitle = page.locator('h3:has-text("Terminal Centro")')
    await expect(drawerTitle).toBeVisible()

    // Verify check-in button is visible
    const checkInBtn = page.locator('button:has-text("Estoy en esta parada")')
    await expect(checkInBtn).toBeVisible()
  })
})
