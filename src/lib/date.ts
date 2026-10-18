/** 日付をローカルタイムゾーン（JST、SPEC 3章）で `YYYY-MM-DD` 形式にする。 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
