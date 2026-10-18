import type { ReactElement } from 'react'
import { Link, useLocation } from 'react-router'
import { formatLocalDate } from '../lib/date'

/**
 * 画面下部のタブ（「記録」「集計」）。SPEC 5.1、10章。
 * 現在のパスからどちらのタブを表示中かを判定する（props なし。ルーターの文脈で描画する）。
 */
export function BottomTabBar(): ReactElement {
  const { pathname } = useLocation()
  const isSummary = pathname === '/summary' || pathname.startsWith('/summary/')
  const isRecord = pathname === '/'
  // 集計タブの移動先は今日の日ビュー（SPEC 5.2「今日の記録を見る」に合わせる）
  const summaryPath = `/summary/day/${formatLocalDate(new Date())}`

  return (
    <nav className="sticky bottom-0 flex border-t border-gray-200 bg-white">
      <TabLink to="/" label="記録" current={isRecord} />
      <TabLink to={summaryPath} label="集計" current={isSummary} />
    </nav>
  )
}

function TabLink({
  to,
  label,
  current,
}: {
  to: string
  label: string
  current: boolean
}): ReactElement {
  return (
    <Link
      to={to}
      aria-current={current ? 'page' : undefined}
      className={`flex-1 py-3 text-center ${current ? 'font-bold text-blue-600' : 'text-gray-600'}`}
    >
      {label}
    </Link>
  )
}
