// @vitest-environment node
// サーバー側（Vercel Functions）のハンドラーなので、jsdom ではなく Node 環境で動かす
import { describe, expect, it } from 'vitest'
import { GET } from './health.ts'

// TASK.md T03 完了条件「`api/health` のハンドラーのテストが通る」
describe('GET /api/health', () => {
  it('ステータス 200 を返す', () => {
    const res = GET()

    expect(res.status).toBe(200)
  })

  it('Content-Type が application/json である', () => {
    const res = GET()

    expect(res.headers.get('content-type')).toMatch(/^application\/json(;|$)/)
  })

  it('本文が { ok: true } である', async () => {
    const res = GET()

    await expect(res.json()).resolves.toStrictEqual({ ok: true })
  })
})
