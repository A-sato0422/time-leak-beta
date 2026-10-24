// @vitest-environment node
// サーバー側（Vercel Functions）の共通処理なので、jsdom ではなく Node 環境で動かす
import { describe, it } from 'vitest'

// 対象：server/supabase.ts の createSupabaseClient
// SPEC 9.2「SUPABASE_URL：Supabase の接続先」「SUPABASE_SECRET_KEY：サーバー側で使う Supabase の Secret key（sb_secret_...）」
// 実際の Supabase には接続しない。@supabase/supabase-js の createClient を vi.mock で差し替え、渡した値を確かめる。
// 環境変数は原則として process.env を書き換えず、引数で直接渡す（テスト同士が状態に依存しないため）。
// 例外は「引数 env を省略したとき」のケースで、vi.stubEnv で設定し、afterEach の vi.unstubAllEnvs() で戻す。
// 手順4への申し送り：
// - createClient のモックは beforeEach でリセットする（呼び出し回数を数えるケースがあるため、前のケースの呼び出しを持ち越さない）。
// - 「createClient に渡す」ケースは第1・第2引数だけを確かめ、第3引数（設定）の有無は縛らない。
describe('createSupabaseClient', () => {
  describe('環境変数がそろっているとき', () => {
    it.todo('createClient に SUPABASE_URL と SUPABASE_SECRET_KEY をこの順で渡す')
    it.todo('createClient が返したクライアントをそのまま返す')
  })

  // 引数 env の既定値（SPEC 9.2 の環境変数を process.env から読む）
  describe('引数 env を省略したとき', () => {
    it.todo('process.env の SUPABASE_URL と SUPABASE_SECRET_KEY を createClient にこの順で渡す')
  })

  // クライアントを module スコープで使い回さない方針（server/supabase.ts の JSDoc）
  describe('複数回呼んだとき', () => {
    it.todo(
      '2回呼ぶと createClient が2回呼ばれ、それぞれの呼び出しで createClient が返したクライアントを返す',
    )
  })

  // 異常系：設定漏れのまま接続を試みない
  describe('環境変数が足りないとき', () => {
    it.todo(
      'SUPABASE_URL が未設定ならエラーを投げ、メッセージに SUPABASE_URL を含む（createClient は呼ばない）',
    )
    it.todo(
      'SUPABASE_URL が空文字ならエラーを投げ、メッセージに SUPABASE_URL を含む（createClient は呼ばない）',
    )
    it.todo(
      'SUPABASE_SECRET_KEY が未設定ならエラーを投げ、メッセージに SUPABASE_SECRET_KEY を含む（createClient は呼ばない）',
    )
    it.todo(
      'SUPABASE_SECRET_KEY が空文字ならエラーを投げ、メッセージに SUPABASE_SECRET_KEY を含む（createClient は呼ばない）',
    )
  })
})
