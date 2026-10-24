// @vitest-environment node
// サーバー側（Vercel Functions）の共通処理なので、jsdom ではなく Node 環境で動かす
import { describe, it } from 'vitest'

// 対象：server/auth.ts の verifyAppSecret
// SPEC 8.1「すべてのリクエストでヘッダー x-app-secret を検証する。環境変数 APP_SECRET と一致しなければ 401 を返す」
// TASK.md T05 完了条件「合言葉の検証（一致・不一致・未指定）の単体テストが通る」
// 環境変数は原則として process.env を書き換えず、引数で直接渡す（テスト同士が状態に依存しないため）。
// 例外は「引数 env を省略したとき」のケースで、vi.stubEnv で設定し、afterEach の vi.unstubAllEnvs() で戻す。
// 手順4への申し送り：401 を返す各ケースでは、status が 401 であることと、本文の error.code が 'UNAUTHORIZED' であることを確かめる。
describe('verifyAppSecret', () => {
  // 完了条件「一致」
  describe('一致するとき', () => {
    it.todo('x-app-secret が APP_SECRET と一致すれば null を返す（通す）')
    it.todo('ヘッダー名の大文字・小文字が違っても（X-App-Secret）、値が一致すれば null を返す')
  })

  // 完了条件「不一致」。SPEC 5.8 / 8.1 の 401「合言葉が不正」
  describe('一致しないとき', () => {
    it.todo('値が異なれば 401 のレスポンスを返す')
    it.todo('大文字・小文字だけが異なる値は一致とみなさず 401 を返す')
    it.todo('前後に空白が付いた値は一致とみなさず 401 を返す（空白を取り除かない）')
    it.todo('APP_SECRET の先頭部分だけの値（前方一致）は 401 を返す')
    it.todo('APP_SECRET の後ろに文字を足した値は 401 を返す')
  })

  // 完了条件「未指定」。SPEC 8.1 の 401「合言葉が未指定」
  describe('未指定のとき', () => {
    it.todo('x-app-secret ヘッダーがなければ 401 を返す')
    it.todo('x-app-secret ヘッダーが空文字なら 401 を返す')
  })

  // 異常系：サーバー側の設定漏れで認証が素通りしないこと（SPEC 9.3「合言葉を検証する門番として API を挟む」）
  describe('APP_SECRET が設定されていないとき', () => {
    it.todo('APP_SECRET が未設定で、ヘッダーもなければ 401 を返す')
    it.todo('APP_SECRET が未設定で、ヘッダーに何か値があっても 401 を返す')
    it.todo('APP_SECRET が空文字で、ヘッダーも空文字なら 401 を返す')
    it.todo('APP_SECRET が未設定で、ヘッダーが文字列 "undefined" なら 401 を返す')
  })

  // 引数 env の既定値（SPEC 8.1「環境変数 APP_SECRET と一致しなければ 401」）
  describe('引数 env を省略したとき', () => {
    it.todo('process.env の APP_SECRET と照合する（一致すれば null、一致しなければ 401 を返す）')
  })

  // SPEC 8.1 のエラーレスポンスの形式
  describe('401 のレスポンスの内容', () => {
    it.todo(
      '本文が { error: { code: "UNAUTHORIZED", message: <空でない文字列> } } の形式で、conflicts を含まない',
    )
    it.todo('Content-Type が application/json である')
    // SPEC 9.3「合言葉を検証する門番」：正しい合言葉を応答から漏らさない
    it.todo('本文に APP_SECRET の値を含まない')
  })
})
