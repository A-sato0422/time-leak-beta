// implementer がテストファイルなどの保護対象を変更できないようにする PreToolUse フック（SPEC 11.5）
// .claude/agents/implementer.md の frontmatter から呼ばれ、implementer の実行中だけ有効になる。
// 保護対象を変更する操作なら exit 2 でブロックし、理由を stderr で返す。
import { readFileSync } from 'node:fs'
import path from 'node:path'

// 保護対象：テストファイル、Vitest の設定、テストのセットアップ、エージェント定義とフック
const PROTECTED = [
  /\.test\.tsx?$/,
  /(^|\/)vitest\.config\.[cm]?[jt]s$/,
  /(^|\/)src\/test\//,
  /(^|\/)\.claude\//,
]

// Bash で保護対象に触れていそうなコマンドを見分けるための目印
const PROTECTED_IN_COMMAND = /\.test\.tsx?\b|vitest\.config|src\/test\/|\.claude\//
const WRITE_IN_COMMAND =
  /(^|[^0-9&])>(?!&)|\btee\b|\bsed\s+(-\w+\s+)*-\w*i|\bperl\s+-\w*i|\b(rm|mv|cp|truncate|touch|chmod)\b|\bgit\s+(checkout|restore|rm|mv|stash|reset|apply)\b|\bnode\s+-e\b|\bpython3?\b/

function toProjectPath(filePath, projectDir) {
  const normalized = filePath.replaceAll('\\', '/')
  const relative = path.relative(projectDir, filePath).replaceAll('\\', '/')
  return relative && !relative.startsWith('..') ? relative : normalized
}

function block(reason) {
  process.stderr.write(
    `${reason}\n` +
      'implementer は保護対象（*.test.ts(x)、vitest.config.ts、src/test/、.claude/）を変更できません。' +
      'テストが誤っている、または設計と矛盾すると判断した場合は、変更せずに reports/<タスク番号>.md に報告して作業を止めてください。\n',
  )
  process.exit(2)
}

// 入力を読めない場合は、保護を素通りさせないようにブロックする
let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  block('フックの入力を読み取れなかったため、念のためブロックしました。')
}
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd()
const toolInput = input.tool_input ?? {}

if (input.tool_name === 'Bash') {
  const command = String(toolInput.command ?? '')
  if (PROTECTED_IN_COMMAND.test(command) && WRITE_IN_COMMAND.test(command)) {
    block(`保護対象を変更する可能性のあるコマンドをブロックしました: ${command}`)
  }
} else {
  const filePath = toolInput.file_path ?? toolInput.notebook_path
  if (filePath) {
    const target = toProjectPath(String(filePath), projectDir)
    if (PROTECTED.some((pattern) => pattern.test(target))) {
      block(`保護対象のファイルへの変更をブロックしました: ${target}`)
    }
  }
}

process.exit(0)
