/**
 * API のエラーレスポンスを作る（SPEC 8.1）。
 */

/** SPEC 8.1 で定めたエラーのステータス */
export type ErrorStatus = 400 | 401 | 404 | 409 | 500

/**
 * エラーレスポンスの `error` の中身（SPEC 8.1）。
 * `conflicts` は 409（時間の重なり・進行中の記録あり）のときに、重なっている記録を入れる。
 * 記録の型（TimeEntry）は T06 で `shared/` に定義するため、ここでは要素の型を引数で受ける。
 */
export type ApiError<TConflict = unknown> = {
  code: string
  message: string
  conflicts?: readonly TConflict[]
}

/**
 * `{ error: { code, message, conflicts? } }` 形式の JSON レスポンスを、指定したステータスで返す。
 * `conflicts` を渡さなかったときは、本文に `conflicts` のキーを含めない。
 */
export function errorResponse<TConflict>(
  status: ErrorStatus,
  error: ApiError<TConflict>,
): Response {
  // 渡された値に余分なキーがあっても本文に出さないよう、必要なキーだけを詰め直す
  const body: ApiError<TConflict> = { code: error.code, message: error.message }
  if (error.conflicts !== undefined) {
    body.conflicts = error.conflicts
  }
  return new Response(JSON.stringify({ error: body }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
