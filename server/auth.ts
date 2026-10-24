/**
 * 合言葉（`x-app-secret` ヘッダー）の検証（SPEC 8.1）。
 */

/** 合言葉の検証で参照する環境変数 */
export type AppSecretEnv = {
  APP_SECRET?: string
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
  void request
  void env
  throw new Error('not implemented')
}
