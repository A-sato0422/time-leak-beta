/**
 * サーバー側で使う Supabase クライアントの生成（SPEC 9.2）。
 */
import type { SupabaseClient } from '@supabase/supabase-js'

/** Supabase クライアントの生成で参照する環境変数 */
export type SupabaseEnv = {
  SUPABASE_URL?: string
  SUPABASE_SECRET_KEY?: string
}

/**
 * 環境変数 `SUPABASE_URL`・`SUPABASE_SECRET_KEY`（Secret key `sb_secret_...`）から Supabase クライアントを作る。
 * どちらかが未設定・空文字のときは、接続を試みずにエラーを投げる（設定漏れに早く気づくため）。
 *
 * 呼び出すたびに `createClient` を呼んで新しいクライアントを返す。
 * クライアントを module スコープに保持して使い回すことはしない（環境変数の変更やテスト間の状態の持ち越しを避けるため）。
 *
 * @param env 環境変数。省略時は `process.env`（テストでは値を直接渡す）
 */
export function createSupabaseClient(env: SupabaseEnv = process.env): SupabaseClient {
  void env
  throw new Error('not implemented')
}
