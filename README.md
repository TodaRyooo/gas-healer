# gas-healer

Google Apps Script（GAS）を **Clasp + TypeScript / JavaScript** で開発しているエンジニア向けの、
グローバルスコープ汚染・アンチパターン検出CLIツール（兼ESLintプラグイン）です。

GASはブラウザやNode.jsとは異なる独特な実行モデル（グローバルスコープの評価タイミング、
`const`アロー関数の非ホイスト、スクリプトインスタンスの再利用、6分の実行時間制限など）を持つため、
一般的なTypeScript/ESLintの静的解析だけでは検出できないアンチパターンが数多く存在します。
gas-healerはそれらGAS特有の落とし穴を検出する、4つのルールに特化した軽量な静的解析ツールです。

## インストール

```bash
npm install --save-dev gas-healer
# または
npx gas-healer check ./src
```

## 使い方（CLI）

```bash
gas-healer check <対象ディレクトリ>
gas-healer check <対象ディレクトリ> --format=json
```

- 検査対象は `.ts` / `.js` ファイル（Clasp + TypeScript、Clasp + JavaScriptどちらの環境にも対応）
- 4ルールはいずれもAST構造のみを見るルール（型情報は使用しない）のため、`.js`でも`.ts`と同じ精度で検出します
- `ERROR`（重大な違反）が1件でも見つかった場合、CLIは非ゼロの終了コードを返します（CI連携を想定）
- 対象ディレクトリに `.ts` / `.js` ファイルが1つも無い場合は、エラーではなくその旨を知らせるメッセージを表示し、終了コード`0`を返します
- `--format` オプションで出力形式を切り替え可能：
  - `stylish`（デフォルト）：ファイル:行番号、severity、ruleID、メッセージを含む人間可読な出力
  - `json`：CI連携を見据えた構造化出力
  - `compact` は今回のスコープ外（将来対応予定）

### 実行例

```
$ npx gas-healer check ./sample

sample/global-service-violation.ts
  2:12  error  グローバルスコープで SpreadsheetApp のService APIを呼び出しています。関数内で取得してください。  (no-global-service)

sample/global-state-violation.ts
  2:5  warning  グローバルスコープでletによる可変状態を宣言しています。CacheService等への外出しを検討してください。  (no-global-state)

sample/loop-violation.ts
  4:5  warning  ループ内でsetValue()を単発呼び出ししています。setValues()による一括書き込みを検討してください。  (no-setvalue-loop)

sample/trigger-violation.ts
  2:7  error  トリガー関数 "onEdit" がconstアロー関数で定義されています。非ホイストのため function宣言に変更してください。  (no-arrow-trigger)

sample/js-support-demo.js
  2:5  warning  グローバルスコープでletによる可変状態を宣言しています。CacheService等への外出しを検討してください。  (no-global-state)

5 problems (2 errors, 3 warnings, 0 info)
```

対象ディレクトリに `.ts` / `.js` が1つも無い場合は、次のように案内を表示します（終了コード`0`）。

```
$ npx gas-healer check ./empty-dir
対象ディレクトリ "./empty-dir" に検査可能な.ts / .jsファイルが見つかりませんでした。
```

## 使い方（ESLintプラグイン）

ルール本体は `eslint-plugin-gas-healer` としてそのまま `eslint.config.js`（Flat Config）に組み込めます。

```js
// eslint.config.js
import gasHealer from 'gas-healer';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: { parser: tsParser },
    plugins: { 'gas-healer': gasHealer },
    rules: {
      'gas-healer/no-global-service': 'error',
      'gas-healer/no-arrow-trigger': 'error',
      'gas-healer/no-setvalue-loop': 'warn',
      'gas-healer/no-global-state': 'warn',
    },
  },
];
```

これにより、既存のESLint運用（エディタ連携・CI）にそのまま乗せることができます。
なお `gas-healer-ignore.json` によるファイル単位の除外は、CLI (`gas-healer check`) 経由の実行にのみ適用されます。
ESLint単体で実行する場合は、通常のESLint disable コメント（`// eslint-disable-next-line gas-healer/no-global-state`）を利用してください。

## 検出ルール

MVPでは以下4ルールのみを実装しています。

### 1. `no-global-service`（`ERROR`）

関数の外（グローバルスコープ）で `SpreadsheetApp.getActiveSpreadsheet()` 等のGAS Service取得APIを
呼んでいる箇所を検出します。グローバルスコープでのService取得はスクリプト読み込み時に評価され、
トリガー実行時の状態不整合や初期化コスト増加の原因になります。

```ts
// NG
const ss = SpreadsheetApp.getActiveSpreadsheet();
function main() {
  ss.getSheetByName('Sheet1');
}

// OK
function main() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheetByName('Sheet1');
}
```

### 2. `no-arrow-trigger`（`ERROR`）

GASの予約済みシンプルトリガー関数名（`onEdit`, `onOpen`, `onInstall`, `onFormSubmit`,
`onSelectionChange`, `onChange`, `doGet`, `doPost`）が非ホイストの `const` アロー関数で
定義されている箇所を検出します。GASはこれらの名前を持つグローバル関数を自動的に呼び出すため、
バンドラー等によってグローバルスコープから見えなくなったり、非ホイストゆえの実行順序次第で
「関数が未定義」エラーを起こします。

なお `ScriptApp.newTrigger('カスタム名')` で登録するインストーラブルトリガーのハンドラ名は
対象外です（Limitations参照）。

```ts
// NG
const onEdit = (e: GoogleAppsScript.Events.SheetsOnEdit) => { /* ... */ };

// OK
function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit) { /* ... */ }
```

### 3. `no-setvalue-loop`（`WARNING`）

`for` / `forEach` 等のループ内で `Range.setValue()` を単発呼び出ししている箇所を検出します。
ループ内でセル単位のAPI呼び出しを繰り返すとGASの実行時間制限（6分）に抵触しやすく、
`setValues()` による一括書き込みが推奨されます。

```ts
// NG
for (let i = 0; i < data.length; i++) {
  sheet.getRange(i + 1, 1).setValue(data[i]);
}

// OK
const values = data.map(d => [d]);
sheet.getRange(1, 1, values.length, 1).setValues(values);
```

### 4. `no-global-state`（`WARNING`）

グローバルスコープで `let` または `var` により可変な変数を宣言している箇所を検出します。
GASではスクリプトインスタンスがトリガー実行間で再利用されることがあり、
グローバルな可変状態はトリガー間の状態汚染・予期しないバグの原因になります。

```ts
// NG
let cachedData: string[] = [];

// OK（定数はOK、可変状態はCacheService等に外出しする）
const CACHE_KEY = 'cachedData';
```

## Ignore機構

### 1. 設定ファイル（`gas-healer-ignore.json`）

プロジェクトルートに `gas-healer-ignore.json` を置くと、ファイルパス・ルールIDの組み合わせで
検出結果を除外できます（CLI経由の実行時のみ有効）。

```json
{
  "ignores": [
    { "file": "src/legacy/old-script.ts", "ruleId": "no-global-state" },
    { "file": "src/legacy/old-script.ts", "ruleId": "*" }
  ]
}
```

- `ruleId` に `"*"` を指定すると、そのファイルの全ルールを除外します。
- `file` はプロジェクトルートからの相対パスで指定します。

### 2. インラインコメント

対象行の直前に `/* gas-healer-ignore */` を書くと、その行の検出をスキップできます（CLI・ESLint両方で有効）。

```ts
/* gas-healer-ignore */
let legacyGlobalFlag = false;
```

## サンプルプロジェクト

`sample/` 配下に各ルールの違反例・非違反例・ignore機構のデモを用意しています。

```bash
npm run check:sample
# 内部的には: gas-healer check ./sample
```

- `global-service-violation.ts` … `no-global-service` 違反例
- `trigger-violation.ts` … `no-arrow-trigger` 違反例
- `loop-violation.ts` … `no-setvalue-loop` 違反例
- `global-state-violation.ts` … `no-global-state` 違反例
- `inline-ignore-demo.ts` … インラインignoreコメントのデモ（検出されない）
- `ignore-config-demo.ts` … `gas-healer-ignore.json`（リポジトリルート）によるファイル単位除外のデモ（検出されない）
- `clean-example.ts` … 4ルールいずれの違反も無いOK例
- `js-support-demo.js` … 型注釈の無いプレーンなJavaScript（Clasp+JS環境）でも検出されることのデモ

## 開発

```bash
bun install
bun test          # 単体テスト
bun run build      # dist/ へのビルド（tsc）
```

## Limitations（既知の制限）

- **ルール5「未使用のグローバル関数検出」は未実装です。** `ScriptApp.newTrigger(変数名)` のように
  トリガー登録が動的な文字列/変数で行われるケースは静的解析だけでは実行時の実態を追い切れないため、
  今回のMVPでは対象外としています。第2フェーズで対応予定です。
- `no-global-service` は既知のGAS Serviceグローバル名（`SpreadsheetApp`, `DriveApp` など）の
  固定リストに基づいて判定するため、リストに無いServiceやラップされたヘルパー経由の呼び出しは検出できません。
- `no-arrow-trigger` は `onEdit` / `onOpen` 等8つの予約済みシンプルトリガー名のみを対象とし、
  `ScriptApp.newTrigger('カスタム名')` で登録するインストーラブルトリガーのハンドラ名は意図的に対象外です。
  GASのUI（トリガー管理画面）で手動登録されたトリガーはコード上に痕跡が残らず静的解析では原理的に検出不可能なため、
  中途半端な検出で誤った安心感を与えるよりも、確実に判定できる予約済み名のみに絞っています。
- `gas-healer-ignore.json` によるファイル単位の除外はCLI (`gas-healer check`) 実行時のみ有効です。
  ESLintプラグインとして直接利用する場合は、ESLint標準のdisableコメントを使用してください。

## Roadmap（未実装・スコープ外）

- ルール5「未使用のグローバル関数検出」（動的トリガーの実行時解析）
- LLM（Claude API等）を用いた文脈判断による検出精度向上
- VSCode拡張化
- 課金・Pro版機能
- `explain` コマンド（違反理由の詳細説明）
- `--format=compact` の追加

## License

MIT
