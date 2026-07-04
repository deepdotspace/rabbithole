import { test, expect } from 'deepspace/testing'
import { captureConsoleErrors } from './helpers/errors'

/** The custom chrome mounts the wordmark; wait for that instead of a nav bar. */
async function waitForApp(page: import('@playwright/test').Page) {
  await page.getByTestId('app-root').waitFor({ timeout: 15000 })
  await expect(page.getByText('RabbitHole').first()).toBeVisible({ timeout: 15000 })
}

test.describe('Home (public)', () => {
  test('loads without JS errors and shows the real hero', async ({ page }) => {
    const errors = captureConsoleErrors(page)
    await page.goto('/')
    await waitForApp(page)
    await expect(page.getByRole('heading', { name: /go down the rabbit hole/i })).toBeVisible()
    // Scaffold placeholders must be gone.
    await expect(page.locator('text=Your DeepSpace app is running')).toHaveCount(0)
    await expect(page.locator('text=Get started')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('page title is app-specific', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/RabbitHole/)
  })

  test('is public — sign-in shown, no auth overlay leak', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await expect(page.locator('[data-testid="auth-overlay"]')).toHaveCount(0)
  })

  test('unknown route shows 404', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz')
    await page.getByTestId('app-root').waitFor({ timeout: 15000 })
    await expect(page.locator('text=404')).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Digging (signed in)', () => {
  test('create a hole, pull a thread, see nested findings', async ({ users }) => {
    const [user] = await users(1)
    const page = user.page
    const question = `__test-${Date.now()}__ Why do cats purr`

    await page.goto('/')
    await waitForApp(page)

    // Start a hole.
    await page.getByPlaceholder('What are you curious about?').fill(question)
    await page.getByRole('button', { name: /start digging/i }).click()

    // Landed on the board; the root question renders.
    await page.waitForURL(/\/hole\/.+/, { timeout: 15000 })
    await expect(page.getByText(question).first()).toBeVisible({ timeout: 15000 })

    // Pull a thread with the cheap Wikipedia lens.
    await page.getByRole('button', { name: /choose a lens/i }).click()
    await page.getByRole('button', { name: /^Wikipedia/ }).click()

    // Findings nest under the root: at least one Wikipedia lens chip appears.
    await expect(page.getByText('Wikipedia').first()).toBeVisible({ timeout: 60000 })

    // The columns view renders the same tree.
    await page.getByRole('button', { name: 'Columns' }).click()
    await expect(page.getByText('Question').first()).toBeVisible()

    // Cleanup: delete the hole from home.
    await page.goto('/')
    await waitForApp(page)
    try {
      const card = page.locator('article', { hasText: question }).first()
      await card.hover()
      await card.getByRole('button', { name: /delete hole/i }).click()
      await page.getByRole('button', { name: /delete hole/i }).last().click()
      await expect(page.locator('article', { hasText: question })).toHaveCount(0, { timeout: 10000 })
    } catch {
      /* best-effort cleanup */
    }
  })
})
