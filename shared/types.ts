/**
 * フロントと API で共有する型（SPEC 7.1 のテーブル定義、SPEC 8.1 の共通仕様）。
 * - フィールド名は DB の列名・API の JSON と同じ snake_case にする（SPEC 8.2 の `category_id` など）。
 * - 日時（timestamptz）は ISO 8601 形式の文字列で扱う（SPEC 8.1）。
 * - id（uuid）は文字列で扱う。
 */

/** カテゴリの分類（SPEC 4.1、SPEC 7.2 の CHECK 制約） */
export type Kind = 'productive' | 'neutral' | 'waste'

/** カテゴリ（SPEC 7.1 `categories`） */
export type Category = {
  id: string
  name: string
  /** '#RRGGBB' */
  color: string
  kind: Kind
  /** true: 学習内容の選択が必須（自己学習） */
  requires_topic: boolean
  /** true: 週目標の対象（自己学習・読書） */
  counts_toward_goal: boolean
  is_archived: boolean
  sort_order: number
  /** ISO 8601 */
  created_at: string
}

/** 学習内容（SPEC 7.1 `study_topics`） */
export type StudyTopic = {
  id: string
  name: string
  color: string
  sort_order: number
}

/** 記録（SPEC 7.1 `time_entries`） */
export type TimeEntry = {
  id: string
  category_id: string
  /** requires_topic のカテゴリのときのみ値を持つ。それ以外は null */
  study_topic_id: string | null
  /** ISO 8601 */
  started_at: string
  /** ISO 8601。null は進行中 */
  ended_at: string | null
  /** ISO 8601 */
  created_at: string
  /** ISO 8601 */
  updated_at: string
}
