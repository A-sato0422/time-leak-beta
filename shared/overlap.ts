/**
 * 記録の時間の重なり判定（SPEC 3章「時間の重なり」、SPEC 7.2「時間の重なり禁止」）。
 * フロントと API の両方から使うため、Node 専用・DOM 専用の API には依存しない。
 */
import type { TimeEntry } from './types.js'

/**
 * 重なりを判定する対象（これから保存しようとしている記録）。
 * - 追加（POST /api/entries、打刻開始）のときは `id` を省略する。
 * - 修正（PATCH /api/entries/:id、打刻終了）のときは `id` を渡す。同じ `id` の記録は判定から除く。
 * - `ended_at` が null のときは進行中として扱う。
 */
export type OverlapTarget = Pick<TimeEntry, 'started_at' | 'ended_at'> & {
  id?: string
}

/** 重なり判定に使う既存の記録。`TimeEntry` のほか、必要な列だけを持つ値も渡せる */
export type OverlapCandidate = Pick<TimeEntry, 'id' | 'started_at' | 'ended_at'>

/**
 * `entries` のうち、`target` と時間が重なっている記録を返す。
 *
 * 判定は DB の排他制約（SPEC 7.2）と同じにする。
 * - 各記録の範囲は `[started_at, ended_at)`（開始を含み、終了を含まない）。
 * - `ended_at` が null（進行中）の記録は、終了を無限大とみなす（現在時刻には依存しない）。
 * - そのため、一方の終了時刻ともう一方の開始時刻がちょうど一致する場合は重ならない（SPEC 3章）。
 * - 日時は文字列としてではなく瞬間として比較する（タイムゾーンのオフセットが違っても同じ瞬間なら等しい）。
 *
 * `target.id` と同じ `id` の記録（修正対象の自分自身）は結果に含めない。
 * 戻り値は `entries` の順序を保ち、要素は渡された値そのもの（コピーしない）。`entries` は変更しない。
 *
 * 前提：`started_at` / `ended_at` は ISO 8601 として解釈できる文字列で、
 * 終了は開始より後であること（入力チェックは `shared/validation.ts` で行う）。
 */
export function findOverlaps<T extends OverlapCandidate>(
  target: OverlapTarget,
  entries: readonly T[],
): T[] {
  void target
  void entries
  throw new Error('not implemented')
}
