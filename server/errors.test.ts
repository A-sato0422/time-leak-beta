// @vitest-environment node
// サーバー側（Vercel Functions）の共通処理なので、jsdom ではなく Node 環境で動かす
import { describe, it } from 'vitest'

// 対象：server/errors.ts の errorResponse
// TASK.md T05 完了条件「エラーレスポンス生成の単体テストが通る」
describe('errorResponse', () => {
  // SPEC 8.1 のステータス表（400 / 401 / 404 / 409）
  describe('ステータス', () => {
    it.todo('400 を指定するとステータス 400 のレスポンスを返す（入力値の不正）')
    it.todo('401 を指定するとステータス 401 のレスポンスを返す（合言葉が不正または未指定）')
    it.todo('404 を指定するとステータス 404 のレスポンスを返す（対象が存在しない）')
    it.todo('409 を指定するとステータス 409 のレスポンスを返す（進行中の記録あり／時間の重なり）')
  })

  // SPEC 8.1「リクエスト・レスポンスは JSON」
  describe('形式', () => {
    it.todo('Content-Type が application/json である')
  })

  // SPEC 8.1「エラーレスポンスの形式」{ error: { code, message, conflicts? } }
  describe('本文', () => {
    it.todo(
      'conflicts を渡さないとき、本文が { error: { code, message } } と完全に一致する（conflicts のキーを含まない）',
    )
    it.todo(
      'conflicts を渡したとき、本文が { error: { code, message, conflicts } } と完全に一致し、conflicts の各要素が渡した順のまま入る',
    )
    it.todo('conflicts に空配列を渡したとき、本文の conflicts は空配列になる')
    it.todo('日本語の message がそのまま（文字化けせず）本文に入る')
  })
})
