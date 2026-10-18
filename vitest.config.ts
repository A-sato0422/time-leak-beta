import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // React Testing Library で画面のテストを行うため jsdom を使う（純粋関数のテストも jsdom で動かす）
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      // タイムゾーンを JST に固定する（SPEC 3章「タイムゾーン」、11.7「時刻への依存」）
      env: {
        TZ: 'Asia/Tokyo',
      },
    },
  }),
)
