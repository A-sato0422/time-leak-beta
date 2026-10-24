/**
 * 合言葉（`x-app-secret` ヘッダー）の検証（SPEC 8.1）。
 */
import { createHash, timingSafeEqual } from 'node:crypto'
import { errorResponse } from './errors'

/** 合言葉の検証で参照する環境変数 */
export type AppSecretEnv = {
  APP_SECRET?: string
}

/**
 * 2つの文字列が等しいかを、内容に応じて処理時間が変わらない方法で比べる（タイミング攻撃対策）。
 * `timingSafeEqual` は長さの違う入力で例外を投げるため、先に SHA-256 で同じ長さにそろえてから比べる。
 */
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a, 'utf8').digest()
  const hashB = createHash('sha256').update(b, 'utf8').digest()
  return timingSafeEqual(hashA, hashB)
}

/**
 * リクエストの `x-app-secret` ヘッダーが環境変数 `APP_SECRET` と一致するかを確かめる。
 * 一致すれば `null`、一致しない・未指定のときは 401 のエラーレスポンス（SPEC 8.1 の形式）を返す。
 * `APP_SECRET` が未設定・空文字のときは、どのリクエストも通さない（401）。
 *
 * 使い方（api/ 側）：`const denied = verifyAppSecret(request); if (denied) return denied`
 *
 * @param env 環境変数。省略時は `process.env`（テストでは値を直接渡す）
 */
export function verifyAppSecret(
  request: Request,
  env: AppSecretEnv = process.env,
): Response | null {
  const expected = env.APP_SECRET
  const provided = request.headers.get('x-app-secret')
  // 設定漏れ（未設定・空文字）や未指定のときは、比較せずに拒否する
  if (!expected || !provided || !safeEqual(provided, expected)) {
    // 本文に合言葉の値を含めない
    return errorResponse(401, { code: 'UNAUTHORIZED', message: '合言葉が不正または未指定です' })
  }
  return null
}
