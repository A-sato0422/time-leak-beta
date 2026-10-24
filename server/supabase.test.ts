// @vitest-environment node
// サーバー側（Vercel Functions）の共通処理なので、jsdom ではなく Node 環境で動かす
import { createClient } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseClient } from './supabase'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

// 対象：server/supabase.ts の createSupabaseClient
// SPEC 9.2「SUPABASE_URL：Supabase の接続先」「SUPABASE_SECRET_KEY：サーバー側で使う Supabase の Secret key（sb_secret_...）」
// 実際の Supabase には接続しない。@supabase/supabase-js の createClient を vi.mock で差し替え、渡した値を確かめる。
// 環境変数は原則として process.env を書き換えず、引数で直接渡す（テスト同士が状態に依存しないため）。
// 例外は「引数 env を省略したとき」のケースで、vi.stubEnv で設定し、afterEach の vi.unstubAllEnvs() で戻す。
// 手順4への申し送り：
// - createClient のモックは beforeEach でリセットする（呼び出し回数を数えるケースがあるため、前のケースの呼び出しを持ち越さない）。
// - 「createClient に渡す」ケースは第1・第2引数だけを確かめ、第3引数（設定）の有無は縛らない。

const URL_VALUE = 'https://example-project.supabase.co'
const KEY_VALUE = 'sb_secret_test_key_value'

const createClientMock = vi.mocked(createClient)

/** createClient が返すクライアントの代わり（中身は見分けがつけばよい） */
function fakeClient(label: string): ReturnType<typeof createClient> {
  return { label } as unknown as ReturnType<typeof createClient>
}

beforeEach(() => {
  createClientMock.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('createSupabaseClient', () => {
  describe('環境変数がそろっているとき', () => {
    it('createClient に SUPABASE_URL と SUPABASE_SECRET_KEY をこの順で渡す', () => {
      createClientMock.mockReturnValue(fakeClient('client'))
      createSupabaseClient({ SUPABASE_URL: URL_VALUE, SUPABASE_SECRET_KEY: KEY_VALUE })
      expect(createClientMock).toHaveBeenCalledTimes(1)
      const args = createClientMock.mock.calls[0]
      expect(args[0]).toBe(URL_VALUE)
      expect(args[1]).toBe(KEY_VALUE)
    })
    it('createClient が返したクライアントをそのまま返す', () => {
      const client = fakeClient('client')
      createClientMock.mockReturnValue(client)
      const result = createSupabaseClient({
        SUPABASE_URL: URL_VALUE,
        SUPABASE_SECRET_KEY: KEY_VALUE,
      })
      expect(result).toBe(client)
    })
  })

  // 引数 env の既定値（SPEC 9.2 の環境変数を process.env から読む）
  describe('引数 env を省略したとき', () => {
    it('process.env の SUPABASE_URL と SUPABASE_SECRET_KEY を createClient にこの順で渡す', () => {
      vi.stubEnv('SUPABASE_URL', 'https://from-process-env.supabase.co')
      vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_from_process_env')
      createClientMock.mockReturnValue(fakeClient('client'))
      createSupabaseClient()
      expect(createClientMock).toHaveBeenCalledTimes(1)
      const args = createClientMock.mock.calls[0]
      expect(args[0]).toBe('https://from-process-env.supabase.co')
      expect(args[1]).toBe('sb_secret_from_process_env')
    })
  })

  // クライアントを module スコープで使い回さない方針（server/supabase.ts の JSDoc）
  describe('複数回呼んだとき', () => {
    it('2回呼ぶと createClient が2回呼ばれ、それぞれの呼び出しで createClient が返したクライアントを返す', () => {
      const first = fakeClient('first')
      const second = fakeClient('second')
      createClientMock.mockReturnValueOnce(first).mockReturnValueOnce(second)
      const env = { SUPABASE_URL: URL_VALUE, SUPABASE_SECRET_KEY: KEY_VALUE }
      const result1 = createSupabaseClient(env)
      const result2 = createSupabaseClient(env)
      expect(createClientMock).toHaveBeenCalledTimes(2)
      expect(result1).toBe(first)
      expect(result2).toBe(second)
    })
  })

  // 異常系：設定漏れのまま接続を試みない
  describe('環境変数が足りないとき', () => {
    it('SUPABASE_URL が未設定ならエラーを投げ、メッセージに SUPABASE_URL を含む（createClient は呼ばない）', () => {
      expect(() => createSupabaseClient({ SUPABASE_SECRET_KEY: KEY_VALUE })).toThrow(/SUPABASE_URL/)
      expect(createClientMock).not.toHaveBeenCalled()
    })
    it('SUPABASE_URL が空文字ならエラーを投げ、メッセージに SUPABASE_URL を含む（createClient は呼ばない）', () => {
      expect(() =>
        createSupabaseClient({ SUPABASE_URL: '', SUPABASE_SECRET_KEY: KEY_VALUE }),
      ).toThrow(/SUPABASE_URL/)
      expect(createClientMock).not.toHaveBeenCalled()
    })
    it('SUPABASE_SECRET_KEY が未設定ならエラーを投げ、メッセージに SUPABASE_SECRET_KEY を含む（createClient は呼ばない）', () => {
      expect(() => createSupabaseClient({ SUPABASE_URL: URL_VALUE })).toThrow(/SUPABASE_SECRET_KEY/)
      expect(createClientMock).not.toHaveBeenCalled()
    })
    it('SUPABASE_SECRET_KEY が空文字ならエラーを投げ、メッセージに SUPABASE_SECRET_KEY を含む（createClient は呼ばない）', () => {
      expect(() =>
        createSupabaseClient({ SUPABASE_URL: URL_VALUE, SUPABASE_SECRET_KEY: '' }),
      ).toThrow(/SUPABASE_SECRET_KEY/)
      expect(createClientMock).not.toHaveBeenCalled()
    })
  })
})
