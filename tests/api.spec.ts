import { test, expect } from '@playwright/test'

/**
 * Server actions back every tree write and spend owner credits on integrations,
 * so they must reject anonymous callers. The signed-in happy path (createHole →
 * pullThread → real Wikipedia findings) is covered end-to-end in smoke.spec.ts.
 */
test.describe('API tests', () => {
  test('auth proxy forwards to auth worker', async ({ request }) => {
    const res = await request.get('/api/auth/ok')
    expect(res.ok()).toBeTruthy()
  })

  test('createHole rejects unauthenticated callers', async ({ request }) => {
    const res = await request.post('/api/actions/createHole', {
      headers: { 'Content-Type': 'application/json' },
      data: { question: 'unauthorized attempt' },
    })
    expect(res.status()).toBe(401)
  })

  test('pullThread rejects unauthenticated callers', async ({ request }) => {
    const res = await request.post('/api/actions/pullThread', {
      headers: { 'Content-Type': 'application/json' },
      data: { holeId: 'x', parentId: 'y', lens: 'wikipedia', tone: 40 },
    })
    expect(res.status()).toBe(401)
  })

  test('deleteHole rejects unauthenticated callers', async ({ request }) => {
    const res = await request.post('/api/actions/deleteHole', {
      headers: { 'Content-Type': 'application/json' },
      data: { holeId: 'x' },
    })
    expect(res.status()).toBe(401)
  })
})
