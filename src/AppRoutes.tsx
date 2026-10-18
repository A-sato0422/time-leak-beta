import type { ReactElement } from 'react'
import { Route, Routes, useMatch } from 'react-router'
import { BottomTabBar } from './components/BottomTabBar'
import { NotFoundPage } from './pages/NotFoundPage'
import { RecordPage } from './pages/RecordPage'
import { SetupPage } from './pages/SetupPage'
import { DayView } from './pages/summary/DayView'
import { EditPage } from './pages/summary/EditPage'
import { HistoryView } from './pages/summary/HistoryView'
import { WeekView } from './pages/summary/WeekView'

/**
 * SPEC 5.1 のルート定義と、下部タブ（記録・集計）を含む画面の骨組み。
 * ルーター本体（BrowserRouter）は持たず、呼び出し側で包む。
 * テストでは MemoryRouter（initialEntries 指定）で包んで任意のパスを描画する。
 * `/setup`（合言葉入力）は記録・集計どちらのタブにも属さないため、下部タブを表示しない。
 */
export function AppRoutes(): ReactElement {
  const isSetup = useMatch('/setup') !== null

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 p-4">
        <Routes>
          <Route path="/" element={<RecordPage />} />
          <Route path="/summary/day/:date" element={<DayView />} />
          <Route path="/summary/day/:date/edit" element={<EditPage />} />
          <Route path="/summary/week/:monday" element={<WeekView />} />
          <Route path="/summary/history" element={<HistoryView />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {isSetup ? null : <BottomTabBar />}
    </div>
  )
}
