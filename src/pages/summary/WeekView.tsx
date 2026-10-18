import type { ReactElement } from 'react'
import { useParams } from 'react-router'

/** 集計タブ：週（`/summary/week/:monday`）。SPEC 5.1・5.5。`:monday` は useParams で読む。T02 ではプレースホルダー。 */
export function WeekView(): ReactElement {
  const { monday } = useParams()
  return (
    <section>
      <h1 className="text-xl font-bold">集計タブ：週</h1>
      <p>週の月曜日：{monday}</p>
    </section>
  )
}
