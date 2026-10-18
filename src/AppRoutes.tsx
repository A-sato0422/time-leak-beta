import type { ReactElement } from 'react'

/**
 * SPEC 5.1 のルート定義と、下部タブ（記録・集計）を含む画面の骨組み。
 * ルーター本体（BrowserRouter）は持たず、呼び出し側で包む。
 * テストでは MemoryRouter（initialEntries 指定）で包んで任意のパスを描画する。
 */
export function AppRoutes(): ReactElement {
  throw new Error('not implemented')
}
