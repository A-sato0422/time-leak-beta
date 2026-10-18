import { describe, it } from 'vitest'

// テスト対象：src/AppRoutes.tsx（AppRoutes）、src/components/BottomTabBar.tsx（BottomTabBar）
// - AppRoutes を MemoryRouter（initialEntries 指定）で包んで、任意のパスを描画する。
// - 「プレースホルダーが表示される」は、SPEC 5.1 の表の「画面」列の名前（例：「集計タブ：日」）が
//   見出しとして表示されることで確認する。
// - 現在時刻は 2026-10-18（日）12:00 JST に固定し、タイムゾーンは JST とする（SPEC 3章「タイムゾーン」、11.7「時刻への依存」）。

describe('ルーティング（SPEC 5.1）', () => {
  describe('各パスで対応するプレースホルダーが表示される', () => {
    // SPEC 5.1 `/`
    it.todo('`/` で「記録タブ」のプレースホルダーが表示される')
    // SPEC 5.1 `/summary/day/:date`
    it.todo('`/summary/day/2026-10-14` で「集計タブ：日」のプレースホルダーが表示される')
    // SPEC 5.1 `/summary/day/:date/edit`
    it.todo(
      '`/summary/day/2026-10-14/edit` で「タイムライン編集」のプレースホルダーが表示され、「集計タブ：日」は表示されない',
    )
    // SPEC 5.1 `/summary/week/:monday`
    it.todo('`/summary/week/2026-10-12` で「集計タブ：週」のプレースホルダーが表示される')
    // SPEC 5.1 `/summary/history`
    it.todo('`/summary/history` で「集計タブ：履歴」のプレースホルダーが表示される')
    // SPEC 5.1 `/setup`
    it.todo('`/setup` で「合言葉入力」のプレースホルダーが表示される')
  })

  describe('パスのパラメータがプレースホルダーに反映される', () => {
    // SPEC 5.1「`:date` は `YYYY-MM-DD` 形式」、「集計タブの表示状態（対象の日付）は URL で持つ」
    it.todo('`/summary/day/2026-10-14` の日ビューに対象日「2026-10-14」が表示される')
    // SPEC 5.1 `/summary/day/:date/edit`、5.7「対象日の記録を…」
    it.todo('`/summary/day/2026-10-14/edit` のタイムライン編集に対象日「2026-10-14」が表示される')
    // SPEC 5.1「`:monday` は週の月曜日の日付」
    it.todo('`/summary/week/2026-10-12` の週ビューに週の月曜日「2026-10-12」が表示される')
  })

  describe('存在しないパス', () => {
    // SPEC に記載なし。T02 のケース承認で決定：SPEC 5.1 にないパスでは
    // 「ページが見つかりません」を表示し、記録タブ（`/`）へのリンクを置く。
    it.todo('`/unknown` で「ページが見つかりません」が表示され、記録タブ（`/`）へのリンクがある')
  })
})

describe('下部タブ（SPEC 5.1「下部タブは『記録』『集計』の2つ」）', () => {
  describe('表示', () => {
    // SPEC 5.1
    it.todo('`/` で下部タブに「記録」「集計」の2つが表示される')
    // SPEC 5.1（集計タブの各画面でもタブで行き来できる必要がある）
    it.todo(
      '`/summary/day/2026-10-14`・`/summary/week/2026-10-12`・`/summary/history` で下部タブが表示される',
    )
  })

  describe('現在のタブが分かる', () => {
    // SPEC に記載なし。T02 のケース承認で決定：現在のタブは aria-current="page" で表す。
    it.todo('`/` では「記録」タブが選択中で、「集計」タブは選択中でない')
    // SPEC に記載なし。T02 のケース承認で決定：日・週・履歴に加え、編集画面でも「集計」タブを選択中とする
    // （aria-current="page" で表す）。
    it.todo(
      '`/summary/day/2026-10-14`・`/summary/day/2026-10-14/edit`・`/summary/week/2026-10-12`・`/summary/history` では「集計」タブが選択中で、「記録」タブは選択中でない',
    )
  })

  describe('記録と集計を行き来できる', () => {
    // SPEC 5.1。移動先は SPEC に記載なし。T02 のケース承認で決定：5.2「今日の記録を見る」リンク
    // （`/summary/day/今日`）に合わせ、今日の日ビュー `/summary/day/<今日>` へ移動する。
    // 今日の日付は現在時刻を 2026-10-18 12:00 JST に固定して決める。
    it.todo(
      '`/` で「集計」タブをタップすると、今日の日ビュー（`/summary/day/2026-10-18`）の「集計タブ：日」が表示される',
    )
    // SPEC 5.1 `/`
    it.todo(
      '`/summary/day/2026-10-14` で「記録」タブをタップすると、`/` の「記録タブ」が表示される',
    )
    // SPEC 5.1 `/`
    it.todo('`/summary/history` で「記録」タブをタップすると、`/` の「記録タブ」が表示される')
    // SPEC 5.1（記録 → 集計 → 記録 の往復）
    it.todo(
      '`/` から「集計」タブ → 「記録」タブの順にタップすると、「集計タブ：日」→「記録タブ」と表示が切り替わる',
    )
  })

  // SPEC 10章「主要なボタンは画面の下半分に置く」：配置は jsdom では確認できないため、PR レビューで人間が確認する（テストケースにしない）。
})
