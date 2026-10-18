// jest-dom のマッチャー（toBeInTheDocument など）を expect に追加し、型も読み込む
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// タイムゾーンは vitest.config.ts の test.env で TZ=Asia/Tokyo に固定している。
// 設定が効いていない場合は、時刻に依存するテストが誤った結果を出すため、ここで止める。
if (new Date('2026-01-01T00:00:00Z').getTimezoneOffset() !== -540) {
  throw new Error('テストのタイムゾーンが JST（Asia/Tokyo）になっていません')
}

// globals を使っていないため、RTL の自動 cleanup が働かない。各テストの後に描画を片付ける
afterEach(() => {
  cleanup()
})
