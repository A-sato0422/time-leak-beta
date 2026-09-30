# time-leak（24時間見える化アプリ）

- 仕様は SPEC.md、タスクと進捗は TASK.md を参照する。作業前に対象タスクを確認すること。
- 1タスク = 1ブランチ = 1PR。`main` に直接コミットしない。
- 完了条件：`npm run typecheck`・`npm run lint`・`npm run test`・`npm run build` がすべて通ること。
- テストファイル（`*.test.ts(x)`、`vitest.config.ts`、テストのセットアップファイル）は、test-writer 以外は変更しない。`it.skip` / `it.only` の使用も禁止する。
- テストや仕様の誤り・矛盾に気づいたら、変更せずに `reports/<タスク番号>.md` に書いて止まる。
- ローカルで API を動かすときは `vercel dev` を使う。
- 回答・コメント・コミットメッセージは日本語で書く。
