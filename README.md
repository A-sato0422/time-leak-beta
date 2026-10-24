# time-leak

1日24時間の使い方をスマホから打刻して記録し、見える化する個人用Webアプリ。

- 無駄に流れた時間（X・Instagram・YouTube など）の総量と内訳を、日・週単位で確認する
- 自己学習・読書の時間を打刻だけで集計し、週20時間目標の進捗を確認する

## ドキュメント

| ファイル | 内容 |
|---|---|
| [SPEC.md](./SPEC.md) | 要件定義（画面・集計の定義・データ設計・API・開発フロー） |
| [TASK.md](./TASK.md) | MVP のタスク一覧と進捗 |
| [CLAUDE.md](./CLAUDE.md) | Claude Code 向けの作業ルール |

## 技術構成

- フロント：Vite + React + TypeScript、Tailwind CSS、React Router
- API：Vercel Functions（Node.js）
- DB：Supabase（PostgreSQL）
- テスト：Vitest、React Testing Library
- ホスティング：Vercel（`main` への push で本番に自動デプロイ）

## セットアップ

```bash
npm install
```

ルートに `.env.local` を作成し、次の環境変数を設定する（Git には含めない）。

| 変数 | 用途 |
|---|---|
| `SUPABASE_URL` | Supabase の接続先（Project URL） |
| `SUPABASE_SECRET_KEY` | サーバー側で使う Supabase の Secret key（`sb_secret_...`） |
| `APP_SECRET` | アプリの合言葉 |

いずれもサーバー側（`api/`）だけで使うため、`VITE_` 接頭辞は付けない。

## 起動

API（`api/`）も動かすため、Vercel CLI で起動する。

```bash
vercel dev
```

初回はブラウザで `/setup` を開き、合言葉を入力する。

## npm scripts

| コマンド | 内容 |
|---|---|
| `npm run typecheck` | 型チェック |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run build` | 本番ビルド |

4つすべてが通ることを、全タスク共通の完了条件とする。

| コマンド | 内容 |
|---|---|
| `npm run test:watch` | Vitest（ウォッチモード） |
| `npm run format` | Prettier で整形 |
| `npm run format:check` | 整形漏れの確認 |
