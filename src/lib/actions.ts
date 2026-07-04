/**
 * Thin client for the app's server actions. Every tree write goes through here.
 */

import { getAuthToken } from 'deepspace'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function callAction<T = unknown>(
  name: string,
  params: Record<string, unknown>,
): Promise<ActionResult<T>> {
  const token = await getAuthToken()
  if (!token) return { success: false, error: 'Sign in to continue.' }
  const res = await fetch(`/api/actions/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(params),
  })
  if (!res.ok && res.status === 401) return { success: false, error: 'Sign in to continue.' }
  try {
    return (await res.json()) as ActionResult<T>
  } catch {
    return { success: false, error: 'Something went wrong.' }
  }
}
