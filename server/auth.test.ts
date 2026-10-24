// @vitest-environment node
// サーバー側（Vercel Functions）の共通処理なので、jsdom ではなく Node 環境で動かす
import { afterEach, describe, expect, it, vi } from 'vitest'
import { verifyAppSecret } from './auth'

// 対象：server/auth.ts の verifyAppSecret
// SPEC 8.1「すべてのリクエストでヘッダー x-app-secret を検証する。環境変数 APP_SECRET と一致しなければ 401 を返す」
// TASK.md T05 完了条件「合言葉の検証（一致・不一致・未指定）の単体テストが通る」
// 環境変数は原則として process.env を書き換えず、引数で直接渡す（テスト同士が状態に依存しないため）。
// 例外は「引数 env を省略したとき」のケースで、vi.stubEnv で設定し、afterEach の vi.unstubAllEnvs() で戻す。
// 手順4への申し送り：401 を返す各ケースでは、status が 401 であることと、本文の error.code が 'UNAUTHORIZED' であることを確かめる。

const SECRET = 'correct-horse-battery-staple'

/** x-app-secret ヘッダー付きのリクエストを作る。headerValue が undefined ならヘッダーを付けない */
function makeRequest(headerValue?: string, headerName = 'x-app-secret'): Request {
  const headers = new Headers()
  if (headerValue !== undefined) {
    headers.set(headerName, headerValue)
  }
  return new Request('http://localhost/api/health', { headers })
}

/** 401 のレスポンスであること（status と本文の error.code）を確かめ、本文を返す */
async function expectUnauthorized(response: Response | null): Promise<unknown> {
  expect(response).not.toBeNull()
  const res = response as Response
  expect(res.status).toBe(401)
  const body = (await res.json()) as { error?: { code?: unknown } }
  expect(body.error?.code).toBe('UNAUTHORIZED')
  return body
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('verifyAppSecret', () => {
  // 完了条件「一致」
  describe('一致するとき', () => {
    it('x-app-secret が APP_SECRET と一致すれば null を返す（通す）', () => {
      expect(verifyAppSecret(makeRequest(SECRET), { APP_SECRET: SECRET })).toBeNull()
    })
    it('ヘッダー名の大文字・小文字が違っても（X-App-Secret）、値が一致すれば null を返す', () => {
      expect(
        verifyAppSecret(makeRequest(SECRET, 'X-App-Secret'), { APP_SECRET: SECRET }),
      ).toBeNull()
    })
  })

  // 完了条件「不一致」。SPEC 5.8 / 8.1 の 401「合言葉が不正」
  describe('一致しないとき', () => {
    it('値が異なれば 401 のレスポンスを返す', async () => {
      await expectUnauthorized(verifyAppSecret(makeRequest('wrong-secret'), { APP_SECRET: SECRET }))
    })
    it('大文字・小文字だけが異なる値は一致とみなさず 401 を返す', async () => {
      await expectUnauthorized(
        verifyAppSecret(makeRequest(SECRET.toUpperCase()), { APP_SECRET: SECRET }),
      )
    })
    it('APP_SECRET の先頭部分だけの値（前方一致）は 401 を返す', async () => {
      await expectUnauthorized(
        verifyAppSecret(makeRequest(SECRET.slice(0, 7)), { APP_SECRET: SECRET }),
      )
    })
    it('APP_SECRET の後ろに文字を足した値は 401 を返す', async () => {
      await expectUnauthorized(verifyAppSecret(makeRequest(`${SECRET}x`), { APP_SECRET: SECRET }))
    })
  })

  // 完了条件「未指定」。SPEC 8.1 の 401「合言葉が未指定」
  describe('未指定のとき', () => {
    it('x-app-secret ヘッダーがなければ 401 を返す', async () => {
      await expectUnauthorized(verifyAppSecret(makeRequest(), { APP_SECRET: SECRET }))
    })
    it('x-app-secret ヘッダーが空文字なら 401 を返す', async () => {
      await expectUnauthorized(verifyAppSecret(makeRequest(''), { APP_SECRET: SECRET }))
    })
  })

  // 異常系：サーバー側の設定漏れで認証が素通りしないこと（SPEC 9.3「合言葉を検証する門番として API を挟む」）
  describe('APP_SECRET が設定されていないとき', () => {
    it('APP_SECRET が未設定で、ヘッダーもなければ 401 を返す', async () => {
      await expectUnauthorized(verifyAppSecret(makeRequest(), {}))
    })
    it('APP_SECRET が未設定で、ヘッダーに何か値があっても 401 を返す', async () => {
      await expectUnauthorized(verifyAppSecret(makeRequest('anything'), {}))
    })
    it('APP_SECRET が空文字で、ヘッダーも空文字なら 401 を返す', async () => {
      await expectUnauthorized(verifyAppSecret(makeRequest(''), { APP_SECRET: '' }))
    })
    it('APP_SECRET が未設定で、ヘッダーが文字列 "undefined" なら 401 を返す', async () => {
      await expectUnauthorized(verifyAppSecret(makeRequest('undefined'), {}))
    })
  })

  // 引数 env の既定値（SPEC 8.1「環境変数 APP_SECRET と一致しなければ 401」）
  describe('引数 env を省略したとき', () => {
    it('process.env の APP_SECRET と照合する（一致すれば null、一致しなければ 401 を返す）', async () => {
      vi.stubEnv('APP_SECRET', SECRET)
      expect(verifyAppSecret(makeRequest(SECRET))).toBeNull()
      await expectUnauthorized(verifyAppSecret(makeRequest('wrong-secret')))
    })
  })

  // SPEC 8.1 のエラーレスポンスの形式
  describe('401 のレスポンスの内容', () => {
    it('本文が { error: { code: "UNAUTHORIZED", message: <空でない文字列> } } の形式で、conflicts を含まない', async () => {
      const body = await expectUnauthorized(
        verifyAppSecret(makeRequest('wrong-secret'), { APP_SECRET: SECRET }),
      )
      expect(Object.keys(body as object)).toEqual(['error'])
      const error = (body as { error: Record<string, unknown> }).error
      expect(Object.keys(error).sort()).toEqual(['code', 'message'])
      expect(error).not.toHaveProperty('conflicts')
      expect(typeof error.message).toBe('string')
      expect((error.message as string).length).toBeGreaterThan(0)
    })
    it('Content-Type が application/json である', async () => {
      const res = verifyAppSecret(makeRequest('wrong-secret'), { APP_SECRET: SECRET })
      await expectUnauthorized(res)
      expect((res as Response).headers.get('content-type')).toMatch(/^application\/json\b/)
    })
    // SPEC 9.3「合言葉を検証する門番」：正しい合言葉を応答から漏らさない
    it('本文に APP_SECRET の値を含まない', async () => {
      // 不一致・未指定のどちらの応答にも含まれないことを確かめる
      for (const request of [makeRequest('wrong-secret'), makeRequest()]) {
        const res = verifyAppSecret(request, { APP_SECRET: SECRET })
        expect(res).not.toBeNull()
        const res401 = res as Response
        expect(res401.status).toBe(401)
        const text = await res401.text()
        expect(JSON.parse(text)).toMatchObject({ error: { code: 'UNAUTHORIZED' } })
        expect(text).not.toContain(SECRET)
      }
    })
  })
})
