import type { ReactElement } from 'react'
import { Link } from 'react-router'

/** SPEC 5.1 にないパスで表示する画面。T02 のケース承認で決定：記録タブ（`/`）へのリンクを置く。 */
export function NotFoundPage(): ReactElement {
  return (
    <section>
      <h1 className="text-xl font-bold">ページが見つかりません</h1>
      <Link to="/" className="mt-4 inline-block text-blue-600 underline">
        記録タブへ戻る
      </Link>
    </section>
  )
}
