/**
 * 疎通確認用のエンドポイント（GET /api/health）。
 * Vercel Functions の Web 標準の書き方（メソッド名の関数を export する）で、`{ ok: true }` を返す。
 */
export function GET(): Response {
  return Response.json({ ok: true })
}
