import type { ReactElement } from 'react'
import { useParams } from 'react-router'

/** タイムライン編集（`/summary/day/:date/edit`）。SPEC 5.1・5.7。`:date` は useParams で読む。T02 ではプレースホルダー。 */
export function EditPage(): ReactElement {
  const { date } = useParams()
  return (
    <section>
      <h1 className="text-xl font-bold">タイムライン編集</h1>
      <p>対象日：{date}</p>
    </section>
  )
}
