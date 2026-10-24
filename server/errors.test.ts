// @vitest-environment node
// サーバー側（Vercel Functions）の共通処理なので、jsdom ではなく Node 環境で動かす
import { describe, expect, it } from 'vitest'
import { errorResponse } from './errors'

// 対象：server/errors.ts の errorResponse
// TASK.md T05 完了条件「エラーレスポンス生成の単体テストが通る」
describe('errorResponse', () => {
  // SPEC 8.1 のステータス表（400 / 401 / 404 / 409）
  describe('ステータス', () => {
    it('400 を指定するとステータス 400 のレスポンスを返す（入力値の不正）', () => {
      const res = errorResponse(400, { code: 'VALIDATION_ERROR', message: 'invalid' })
      expect(res.status).toBe(400)
    })
    it('401 を指定するとステータス 401 のレスポンスを返す（合言葉が不正または未指定）', () => {
      const res = errorResponse(401, { code: 'UNAUTHORIZED', message: 'unauthorized' })
      expect(res.status).toBe(401)
    })
    it('404 を指定するとステータス 404 のレスポンスを返す（対象が存在しない）', () => {
      const res = errorResponse(404, { code: 'NOT_FOUND', message: 'not found' })
      expect(res.status).toBe(404)
    })
    it('409 を指定するとステータス 409 のレスポンスを返す（進行中の記録あり／時間の重なり）', () => {
      const res = errorResponse(409, { code: 'OVERLAP', message: 'overlap', conflicts: [] })
      expect(res.status).toBe(409)
    })
  })

  // SPEC 8.1「リクエスト・レスポンスは JSON」
  describe('形式', () => {
    it('Content-Type が application/json である', () => {
      const res = errorResponse(400, { code: 'VALIDATION_ERROR', message: 'invalid' })
      expect(res.headers.get('content-type')).toMatch(/^application\/json\b/)
    })
  })

  // SPEC 8.1「エラーレスポンスの形式」{ error: { code, message, conflicts? } }
  describe('本文', () => {
    it('conflicts を渡さないとき、本文が { error: { code, message } } と完全に一致する（conflicts のキーを含まない）', async () => {
      const res = errorResponse(404, { code: 'NOT_FOUND', message: 'entry not found' })
      const body = (await res.json()) as { error: Record<string, unknown> }
      expect(body).toStrictEqual({ error: { code: 'NOT_FOUND', message: 'entry not found' } })
      expect(Object.keys(body.error)).not.toContain('conflicts')
    })
    it('conflicts を渡したとき、本文が { error: { code, message, conflicts } } と完全に一致し、conflicts の各要素が渡した順のまま入る', async () => {
      const conflicts = [
        { id: 'entry-b', started_at: '2026-10-24T10:00:00+09:00', ended_at: null },
        {
          id: 'entry-a',
          started_at: '2026-10-24T08:00:00+09:00',
          ended_at: '2026-10-24T09:00:00+09:00',
        },
      ]
      const res = errorResponse(409, { code: 'OVERLAP', message: 'overlap', conflicts })
      const body: unknown = await res.json()
      expect(body).toStrictEqual({
        error: {
          code: 'OVERLAP',
          message: 'overlap',
          conflicts: [
            { id: 'entry-b', started_at: '2026-10-24T10:00:00+09:00', ended_at: null },
            {
              id: 'entry-a',
              started_at: '2026-10-24T08:00:00+09:00',
              ended_at: '2026-10-24T09:00:00+09:00',
            },
          ],
        },
      })
    })
    it('conflicts に空配列を渡したとき、本文の conflicts は空配列になる', async () => {
      const res = errorResponse(409, { code: 'OVERLAP', message: 'overlap', conflicts: [] })
      const body: unknown = await res.json()
      expect(body).toStrictEqual({ error: { code: 'OVERLAP', message: 'overlap', conflicts: [] } })
    })
    it('日本語の message がそのまま（文字化けせず）本文に入る', async () => {
      const message = '他の記録と時間が重なっています'
      const res = errorResponse(409, { code: 'OVERLAP', message, conflicts: [] })
      // バイト列から UTF-8 として読み、文字化けしていないことを確かめる
      const text = new TextDecoder('utf-8').decode(await res.arrayBuffer())
      expect(text).toContain(message)
      expect((JSON.parse(text) as { error: { message: string } }).error.message).toBe(message)
    })
  })
})
