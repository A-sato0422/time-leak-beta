import type { ReactElement } from 'react'
import { useParams } from 'react-router'

/** 集計タブ：日（`/summary/day/:date`）。SPEC 5.1・5.4。`:date` は useParams で読む。T02 ではプレースホルダー。 */
export function DayView(): ReactElement {
  const { date } = useParams()
  return (
    <section>
      <h1 className="text-xl font-bold">集計タブ：日</h1>
      <p>対象日：{date}</p>
    </section>
  )
}
