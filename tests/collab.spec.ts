/**
 * Multi-user spec — a hole is private until its owner shares it, then anyone
 * with the link can follow the trail read-only. This exercises the holes/nodes
 * `visibilityField` + `'own'`/`'shared'` permissions across two users.
 *
 * Uses the first two accounts in the shared pool via `users(2)`.
 */
import { test, expect } from 'deepspace/testing'

async function waitForHome(page: import('@playwright/test').Page) {
  await page.getByTestId('app-root').waitFor({ timeout: 15000 })
  await expect(page.getByText('RabbitHole').first()).toBeVisible({ timeout: 15000 })
}

test('a shared hole becomes readable to another user; private stays hidden', async ({ users }) => {
  const [owner, other] = await users(2)
  const question = `__test-${Date.now()}__ How do fireflies glow`

  // Owner creates a hole.
  await owner.page.goto('/')
  await waitForHome(owner.page)
  await owner.page.getByPlaceholder('What are you curious about?').fill(question)
  await owner.page.getByRole('button', { name: /start digging/i }).click()
  await owner.page.waitForURL(/\/dig\/.+/, { timeout: 15000 })
  const holeUrl = owner.page.url()
  await expect(owner.page.getByText(question).first()).toBeVisible({ timeout: 15000 })

  // While private, the other user cannot open it.
  await other.page.goto(holeUrl)
  await expect(other.page.getByText("This dig isn't here")).toBeVisible({ timeout: 15000 })
  await expect(other.page.getByText(question)).toHaveCount(0)

  // Owner shares it.
  await owner.page.getByRole('button', { name: 'Share' }).click()
  await expect(owner.page.getByText(/Shared/).first()).toBeVisible({ timeout: 15000 })

  // Now the other user sees the trail, read-only.
  await other.page.goto(holeUrl)
  await expect(other.page.getByText(question).first()).toBeVisible({ timeout: 15000 })
  await expect(other.page.getByText(/reading only/i)).toBeVisible()
  await expect(other.page.getByRole('button', { name: /choose a lens/i })).toHaveCount(0)

  // Cleanup.
  await owner.page.goto('/')
  await waitForHome(owner.page)
  try {
    const card = owner.page.locator('article', { hasText: question }).first()
    await card.hover()
    await card.getByRole('button', { name: /delete dig/i }).click()
    await owner.page.getByRole('button', { name: /delete dig/i }).last().click()
    await expect(owner.page.locator('article', { hasText: question })).toHaveCount(0, { timeout: 10000 })
  } catch {
    /* best-effort */
  }
})
