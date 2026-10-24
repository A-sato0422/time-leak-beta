// @vitest-environment node
// フロントと API で共有する純粋関数なので、DOM に依存しない Node 環境で動かす
import { afterEach, describe, expect, it, vi } from 'vitest'
import { findOverlaps, type OverlapCandidate } from './overlap'
import type { TimeEntry } from './types'

// テスト用の日時。実行環境の TZ に依存しないよう、オフセット付きの ISO 文字列で書く
const DAY = '2026-10-24'
const NEXT_DAY = '2026-10-25'

/** JST の時刻（'HH:MM' または 'HH:MM:SS'）を、オフセット +09:00 付きの ISO 8601 文字列にする */
function jst(time: string, date: string = DAY): string {
  const hms = time.length === 5 ? `${time}:00` : time
  return `${date}T${hms}+09:00`
}

/** 重なり判定に必要な列だけを持つ既存の記録 */
function candidate(id: string, startedAt: string, endedAt: string | null): OverlapCandidate {
  return { id, started_at: startedAt, ended_at: endedAt }
}

/** すべての列を持つ記録（SPEC 7.1 time_entries） */
function timeEntry(
  id: string,
  startedAt: string,
  endedAt: string | null,
  overrides: Partial<TimeEntry> = {},
): TimeEntry {
  return {
    id,
    category_id: `category-${id}`,
    study_topic_id: null,
    started_at: startedAt,
    ended_at: endedAt,
    created_at: '2026-10-24T00:00:00+09:00',
    updated_at: '2026-10-24T00:00:00+09:00',
    ...overrides,
  }
}

afterEach(() => {
  vi.useRealTimers()
})

// 対象：shared/overlap.ts の findOverlaps
// TASK.md T06 完了条件「重なる／重ならない／端が接する／進行中の記録との重なり／自分自身は除外」
// 判定の根拠：SPEC 3章「時間の重なり」（終了時刻と次の開始時刻がちょうど一致する場合は重なりとみなさない）、
//             SPEC 7.2 の排他制約の範囲 tstzrange(started_at, coalesce(ended_at, 'infinity'), '[)')
// 日時はすべて JST（+09:00）の ISO 8601 文字列で書く（SPEC 3章「タイムゾーン」、SPEC 8.1）
describe('findOverlaps', () => {
  // SPEC 3章「時間の重なり」：重ならない場合は何も返さない
  describe('重ならない', () => {
    it('既存の記録が空配列のとき、空配列を返す（空データ）', () => {
      const result = findOverlaps({ started_at: jst('11:00'), ended_at: jst('12:00') }, [])
      expect(result).toEqual([])
    })
    it('対象の開始より前に終わる記録は返さない（既存 9:00〜10:00、対象 11:00〜12:00）', () => {
      const existing = candidate('a', jst('09:00'), jst('10:00'))
      const result = findOverlaps({ started_at: jst('11:00'), ended_at: jst('12:00') }, [existing])
      expect(result).toEqual([])
    })
    it('対象の終了より後に始まる記録は返さない（既存 13:00〜14:00、対象 11:00〜12:00）', () => {
      const existing = candidate('a', jst('13:00'), jst('14:00'))
      const result = findOverlaps({ started_at: jst('11:00'), ended_at: jst('12:00') }, [existing])
      expect(result).toEqual([])
    })
  })

  // SPEC 3章「終了時刻と次の開始時刻がちょうど一致する場合は重なりとみなさない」、SPEC 7.2 の '[)'
  describe('端が接する', () => {
    it('既存の終了と対象の開始が一致する記録は返さない（既存 10:00〜11:00、対象 11:00〜12:00）', () => {
      const existing = candidate('a', jst('10:00'), jst('11:00'))
      const result = findOverlaps({ started_at: jst('11:00'), ended_at: jst('12:00') }, [existing])
      expect(result).toEqual([])
    })
    it('対象の終了と既存の開始が一致する記録は返さない（既存 12:00〜13:00、対象 11:00〜12:00）', () => {
      const existing = candidate('a', jst('12:00'), jst('13:00'))
      const result = findOverlaps({ started_at: jst('11:00'), ended_at: jst('12:00') }, [existing])
      expect(result).toEqual([])
    })
    it('前後の記録の両方と端が接するとき、空配列を返す（10:00〜11:00 と 12:00〜13:00、対象 11:00〜12:00）', () => {
      const before = candidate('a', jst('10:00'), jst('11:00'))
      const after = candidate('b', jst('12:00'), jst('13:00'))
      const result = findOverlaps({ started_at: jst('11:00'), ended_at: jst('12:00') }, [
        before,
        after,
      ])
      expect(result).toEqual([])
    })
  })

  // SPEC 3章「時間の重なり」：一部でも時間が重なる記録を返す
  describe('重なる', () => {
    const target = { started_at: jst('11:00'), ended_at: jst('12:00') }

    it('対象の開始をまたぐ記録を返す（既存 10:00〜11:30、対象 11:00〜12:00）', () => {
      const existing = candidate('a', jst('10:00'), jst('11:30'))
      expect(findOverlaps(target, [existing])).toEqual([existing])
    })
    it('対象の終了をまたぐ記録を返す（既存 11:30〜13:00、対象 11:00〜12:00）', () => {
      const existing = candidate('a', jst('11:30'), jst('13:00'))
      expect(findOverlaps(target, [existing])).toEqual([existing])
    })
    it('対象を含む記録を返す（既存 10:00〜13:00、対象 11:00〜12:00）', () => {
      const existing = candidate('a', jst('10:00'), jst('13:00'))
      expect(findOverlaps(target, [existing])).toEqual([existing])
    })
    it('対象に含まれる記録を返す（既存 11:15〜11:45、対象 11:00〜12:00）', () => {
      const existing = candidate('a', jst('11:15'), jst('11:45'))
      expect(findOverlaps(target, [existing])).toEqual([existing])
    })
    it('対象とまったく同じ範囲の記録を返す（既存 11:00〜12:00、対象 11:00〜12:00）', () => {
      const existing = candidate('a', jst('11:00'), jst('12:00'))
      expect(findOverlaps(target, [existing])).toEqual([existing])
    })
    it('重なりが1秒だけの記録も返す（既存 10:00〜11:00:01、対象 11:00〜12:00）', () => {
      const existing = candidate('a', jst('10:00'), jst('11:00:01'))
      expect(findOverlaps(target, [existing])).toEqual([existing])
    })
  })

  // SPEC 3章「日付をまたぐ記録」は1件のまま保存するため、0:00 で区切らずに判定する
  describe('0:00 をまたぐ記録', () => {
    it('0:00 をまたぐ既存の記録と、翌日の朝の対象が重なるとき、その記録を返す（既存 23:00〜翌 7:00、対象 翌 6:30〜8:00）', () => {
      const existing = candidate('a', jst('23:00'), jst('07:00', NEXT_DAY))
      const result = findOverlaps(
        { started_at: jst('06:30', NEXT_DAY), ended_at: jst('08:00', NEXT_DAY) },
        [existing],
      )
      expect(result).toEqual([existing])
    })
    it('0:00 をまたぐ対象と、前日の夜の既存の記録が重なるとき、その記録を返す（既存 22:00〜23:30、対象 23:00〜翌 1:00）', () => {
      const existing = candidate('a', jst('22:00'), jst('23:30'))
      const result = findOverlaps({ started_at: jst('23:00'), ended_at: jst('01:00', NEXT_DAY) }, [
        existing,
      ])
      expect(result).toEqual([existing])
    })
    it('0:00 ちょうどで端が接する記録は返さない（既存 22:00〜翌 0:00、対象 翌 0:00〜1:00）', () => {
      const existing = candidate('a', jst('22:00'), jst('00:00', NEXT_DAY))
      const result = findOverlaps(
        { started_at: jst('00:00', NEXT_DAY), ended_at: jst('01:00', NEXT_DAY) },
        [existing],
      )
      expect(result).toEqual([])
    })
  })

  // SPEC 7.1「ended_at が null = 進行中」、SPEC 7.2 の coalesce(ended_at, 'infinity')
  describe('進行中の記録', () => {
    describe('既存の記録が進行中', () => {
      it('進行中の記録の開始より後の対象と重なるとき、その記録を返す（既存 9:00〜進行中、対象 10:00〜11:00）', () => {
        const existing = candidate('a', jst('09:00'), null)
        const result = findOverlaps({ started_at: jst('10:00'), ended_at: jst('11:00') }, [
          existing,
        ])
        expect(result).toEqual([existing])
      })
      it('進行中の記録の開始より前に終わる対象とは重ならない（既存 9:00〜進行中、対象 7:00〜8:00）', () => {
        const existing = candidate('a', jst('09:00'), null)
        const result = findOverlaps({ started_at: jst('07:00'), ended_at: jst('08:00') }, [
          existing,
        ])
        expect(result).toEqual([])
      })
      it('対象の終了と進行中の記録の開始が一致するときは返さない（既存 9:00〜進行中、対象 8:00〜9:00）', () => {
        const existing = candidate('a', jst('09:00'), null)
        const result = findOverlaps({ started_at: jst('08:00'), ended_at: jst('09:00') }, [
          existing,
        ])
        expect(result).toEqual([])
      })
      it('進行中の記録の終了は現在時刻ではなく無限大とみなす（現在時刻を 10:00 に固定し、既存 9:00〜進行中、対象 11:00〜12:00 で返す）', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(jst('10:00')))
        const existing = candidate('a', jst('09:00'), null)
        const result = findOverlaps({ started_at: jst('11:00'), ended_at: jst('12:00') }, [
          existing,
        ])
        expect(result).toEqual([existing])
      })
    })
    describe('判定対象が進行中', () => {
      const target = { started_at: jst('09:00'), ended_at: null }

      it('対象の開始より後に始まる記録を返す（既存 10:00〜11:00、対象 9:00〜進行中）', () => {
        const existing = candidate('a', jst('10:00'), jst('11:00'))
        expect(findOverlaps(target, [existing])).toEqual([existing])
      })
      it('対象の開始をまたぐ記録を返す（既存 8:00〜9:30、対象 9:00〜進行中）', () => {
        const existing = candidate('a', jst('08:00'), jst('09:30'))
        expect(findOverlaps(target, [existing])).toEqual([existing])
      })
      it('既存の終了と対象の開始が一致する記録は返さない（既存 8:00〜9:00、対象 9:00〜進行中）', () => {
        const existing = candidate('a', jst('08:00'), jst('09:00'))
        expect(findOverlaps(target, [existing])).toEqual([])
      })
      it('対象の開始より前に終わる記録は返さない（既存 7:00〜8:00、対象 9:00〜進行中）', () => {
        const existing = candidate('a', jst('07:00'), jst('08:00'))
        expect(findOverlaps(target, [existing])).toEqual([])
      })
    })
    it('既存の記録と判定対象の両方が進行中のとき、その記録を返す（既存 9:00〜進行中、対象 10:00〜進行中）', () => {
      const existing = candidate('a', jst('09:00'), null)
      const result = findOverlaps({ started_at: jst('10:00'), ended_at: null }, [existing])
      expect(result).toEqual([existing])
    })
  })

  // 修正（SPEC 5.7、SPEC 8.2 PATCH /api/entries/:id）では、修正前の自分自身と重なってもエラーにしない
  describe('自分自身の除外', () => {
    it('対象の id と同じ id の記録は、時間が重なっていても返さない', () => {
      const self = candidate('self', jst('10:00'), jst('11:00'))
      const result = findOverlaps(
        { id: 'self', started_at: jst('10:00'), ended_at: jst('11:00') },
        [self],
      )
      expect(result).toEqual([])
    })
    it('修正で時間をずらしたとき、自分自身を除いた重なる記録だけを返す（自分 10:00〜11:00 を 10:30〜11:30 に変更し、11:00〜12:00 の記録と重なる）', () => {
      const self = candidate('self', jst('10:00'), jst('11:00'))
      const other = candidate('other', jst('11:00'), jst('12:00'))
      const result = findOverlaps(
        { id: 'self', started_at: jst('10:30'), ended_at: jst('11:30') },
        [self, other],
      )
      expect(result).toEqual([other])
    })
    it('対象の id を省略したとき（追加）は、重なるすべての記録を返す', () => {
      const first = candidate('self', jst('10:00'), jst('11:00'))
      const second = candidate('other', jst('11:00'), jst('12:00'))
      const result = findOverlaps({ started_at: jst('10:30'), ended_at: jst('11:30') }, [
        first,
        second,
      ])
      expect(result).toEqual([first, second])
    })
    it('進行中の自分自身の開始時刻を変更するとき、自分自身は返さない（自分 9:00〜進行中 を 8:30〜進行中 に変更）', () => {
      const self = candidate('self', jst('09:00'), null)
      const result = findOverlaps({ id: 'self', started_at: jst('08:30'), ended_at: null }, [self])
      expect(result).toEqual([])
    })
  })

  // SPEC 3章「重なっている記録を表示する」、SPEC 8.1 の conflicts（TimeEntry[]）
  describe('複数の記録', () => {
    const target = { started_at: jst('11:00'), ended_at: jst('12:00') }

    it('重なる記録をすべて返し、重ならない記録・端が接する記録は返さない', () => {
      const separate = candidate('separate', jst('08:00'), jst('09:00'))
      const touchingBefore = candidate('touching-before', jst('10:00'), jst('11:00'))
      const overlapStart = candidate('overlap-start', jst('10:30'), jst('11:15'))
      const inside = candidate('inside', jst('11:20'), jst('11:40'))
      const overlapEnd = candidate('overlap-end', jst('11:50'), jst('12:30'))
      const touchingAfter = candidate('touching-after', jst('12:00'), jst('13:00'))
      const result = findOverlaps(target, [
        separate,
        touchingBefore,
        overlapStart,
        inside,
        overlapEnd,
        touchingAfter,
      ])
      expect(result).toEqual([overlapStart, inside, overlapEnd])
    })
    it('戻り値は渡した記録の順序を保つ', () => {
      // 時系列と逆順に渡し、開始時刻で並べ替える実装と区別する
      const late = candidate('late', jst('11:45'), jst('12:30'))
      const middle = candidate('middle', jst('11:20'), jst('11:40'))
      const early = candidate('early', jst('10:30'), jst('11:15'))
      const result = findOverlaps(target, [late, middle, early])
      expect(result).toEqual([late, middle, early])
    })
    it('戻り値の要素は渡した記録そのもので、category_id などの他の項目も保たれる', () => {
      const existing = timeEntry('a', jst('10:30'), jst('11:30'), {
        category_id: 'category-study',
        study_topic_id: 'topic-typescript',
      })
      const result = findOverlaps(target, [existing])
      expect(result).toEqual([
        {
          id: 'a',
          category_id: 'category-study',
          study_topic_id: 'topic-typescript',
          started_at: jst('10:30'),
          ended_at: jst('11:30'),
          created_at: '2026-10-24T00:00:00+09:00',
          updated_at: '2026-10-24T00:00:00+09:00',
        },
      ])
      expect(result[0]).toBe(existing)
    })
    it('渡した記録の配列を変更しない', () => {
      const separate = candidate('separate', jst('08:00'), jst('09:00'))
      const overlapping = candidate('overlapping', jst('10:30'), jst('11:30'))
      const self = candidate('self', jst('11:00'), jst('12:00'))
      const entries = [separate, overlapping, self]
      const snapshot = structuredClone(entries)

      const result = findOverlaps({ id: 'self', ...target }, entries)

      expect(result).toEqual([overlapping])
      expect(result).not.toBe(entries)
      expect(entries).toEqual(snapshot)
      expect(entries[0]).toBe(separate)
      expect(entries[1]).toBe(overlapping)
      expect(entries[2]).toBe(self)
    })
  })

  // SPEC 8.1「日時は ISO 8601 形式の文字列」：表記ではなく瞬間として比較する
  describe('時刻の表記の違い', () => {
    const target = { started_at: jst('11:00'), ended_at: jst('12:00') }

    it('オフセットが違っても同じ瞬間なら端が接するとみなし、返さない（既存の終了 11:00+09:00、対象の開始 02:00Z）', () => {
      const existing = candidate('a', jst('10:00'), '2026-10-24T11:00:00+09:00')
      const result = findOverlaps(
        { started_at: '2026-10-24T02:00:00Z', ended_at: '2026-10-24T03:00:00Z' },
        [existing],
      )
      expect(result).toEqual([])
    })
    it('オフセットが違っても瞬間として重なっていれば返す（既存 01:30Z〜02:30Z、対象 11:00+09:00〜12:00+09:00）', () => {
      const existing = candidate('a', '2026-10-24T01:30:00Z', '2026-10-24T02:30:00Z')
      expect(findOverlaps(target, [existing])).toEqual([existing])
    })
    it('ミリ秒の有無が違っても同じ瞬間なら端が接するとみなし、返さない（既存の終了 11:00:00.000+09:00、対象の開始 11:00:00+09:00）', () => {
      const existing = candidate('a', jst('10:00'), '2026-10-24T11:00:00.000+09:00')
      expect(findOverlaps(target, [existing])).toEqual([])
    })
    it('文字列の辞書順では前後が逆になる表記でも、瞬間で比較する（既存 10:30+09:00〜02:30Z、対象 11:00+09:00〜12:00+09:00 で返す）', () => {
      // 既存の終了 '2026-10-24T02:30:00Z' は文字列では対象の開始 '2026-10-24T11:00:00+09:00' より前だが、
      // 瞬間では 11:30+09:00 で対象の開始より後
      const existing = candidate('a', '2026-10-24T10:30:00+09:00', '2026-10-24T02:30:00Z')
      expect(findOverlaps(target, [existing])).toEqual([existing])
    })
    // SPEC 8.1・7.1：started_at / ended_at は timestamptz で、Supabase（PostgREST）は
    // オフセット +00:00・小数部6桁の形式で返すため、その表記の既存記録とも瞬間で比較できることを確かめる
    it('Supabase が返す timestamptz の形式（+00:00・小数部6桁）の既存記録でも、同じ瞬間なら端が接するとみなし、返さない（既存の終了 2026-10-24T02:00:00.000000+00:00、対象の開始 2026-10-24T11:00:00+09:00）', () => {
      const existing = candidate(
        'a',
        '2026-10-24T01:00:00.000000+00:00',
        '2026-10-24T02:00:00.000000+00:00',
      )
      expect(findOverlaps(target, [existing])).toEqual([])
    })
  })
})
