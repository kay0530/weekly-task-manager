# Weekly Task Manager - プロジェクト引き継ぎ

## Tech Stack
- React 19 + Vite 7 + Tailwind CSS 4
- Firebase/Firestore (データ永続化)
- GitHub Pages (デプロイ: `npm run deploy`)
- DOMPurify (HTMLサニタイズ)
- @dnd-kit (ドラッグ&ドロップ)

## 実装済み機能

### 1. 週次タスク管理（基本機能）
- タスクのCRUD（作成・表示・編集・削除）
- 週次報告フィールド: 実施したこと、出来なかったこと、理由、課題、相談事項、備考
- 進捗率・優先度・星評価
- メンバー別ビュー、アーカイブ、ゴミ箱

### 2. ドラッグ&ドロップによるタスク並び替え
- @dnd-kit/core + @dnd-kit/sortable 使用
- Firestore に `order` フィールドで順序を永続化
- ドラッグハンドル付きのカードUI

### 3. リッチテキスト編集（太字・斜体・下線）
- **実装方式**: カスタム contentEditable + document.execCommand + DOMPurify
- **不採用**: TipTap（バンドルサイズ +80-100KB gzip は過剰）
- **バンドルサイズ**: 724KB → 749KB（+25KB、gzip: 221KB → 230KB）

#### 新規コンポーネント
- `src/components/RichTextEditor.jsx` — 入力用: contentEditable div + B/I/U ツールバー
  - `sanitizeHtml()` をエクスポート（RichTextDisplay でも再利用）
  - `plainTextToHtml()` で既存プレーンテキスト（`\n`）を `<br>` に変換
  - `isInternalChange` ref でカーソルリセット防止
- `src/components/RichTextDisplay.jsx` — 表示用: HTML/プレーンテキスト自動判定
  - `isHtml()` regex で判定
  - プレーンテキスト → React通常レンダリング、HTML → DOMPurify + dangerouslySetInnerHTML

#### 変更箇所
- `TaskForm.jsx` — 5つの `<textarea>` → `<RichTextEditor>` に置換
- `TaskCard.jsx` — 7箇所のテキスト表示 → `<RichTextDisplay>` に置換
- `src/index.css` — contentEditable の placeholder/focus CSS
- `package.json` — `dompurify` 追加

### 4. カードサイズ修正
- 折りたたみ時の `line-clamp-2` が正常動作するよう調整

### 5. 詳細展開時の「実施したこと」全文表示
- `TaskCard.jsx`: 展開時に `line-clamp-2` と `overflow-hidden` を解除
- 折りたたみ時は従来通り2行制限、展開時は全文表示

## データ形式の注意点
- Firestore上のテキストフィールドはHTML文字列（`<b>太字</b>`等）またはプレーンテキストが混在
- 後方互換性あり: 既存プレーンテキストはそのまま動作、データマイグレーション不要
- DOMPurify許可タグ: `b, i, u, br, strong, em, div, span`（属性は一切不許可）

## コンポーネント構成
```
src/
├── components/
│   ├── Dashboard.jsx      # メインダッシュボード
│   ├── TaskCard.jsx        # タスクカード表示（RichTextDisplay使用）
│   ├── TaskForm.jsx        # タスク入力フォーム（RichTextEditor使用）
│   ├── RichTextEditor.jsx  # リッチテキスト入力（B/I/U）
│   ├── RichTextDisplay.jsx # リッチテキスト安全表示
│   ├── Header.jsx          # ヘッダー
│   ├── Sidebar.jsx         # サイドバー
│   ├── ProgressBar.jsx     # 進捗バー
│   ├── MemberView.jsx      # メンバー別ビュー
│   ├── ArchiveView.jsx     # アーカイブ
│   ├── TrashView.jsx       # ゴミ箱
│   └── SalesforceSync.jsx  # Salesforce連携
├── index.css               # グローバルCSS（リッチテキスト用スタイル含む）
└── ...
```

## デプロイ
```bash
cd 17_weekly-task-manager
npm run deploy  # build + gh-pages -d dist
```
- GitHub Pagesは GitHub Actions ワークフロー (`build_type: workflow`, `source: main`) でデプロイ
- `main` ブランチにpushすると自動デプロイ（CDN反映まで数分かかる場合あり）
- ワークツリーからの `npm run deploy` は gh-pages ブランチに push するが、Actions ベースのデプロイとは別経路のため反映されないことがある → **main に直接 push するのが確実**
- ローカル dev server は Firebase 認証のためドメイン制限があり、プレビューでは空白になる → 本番 (GitHub Pages) で確認が必要

### preview_start 設定 (Windows)
- `.claude/launch.json` で `"runtimeExecutable": "cmd"`, `"runtimeArgs": ["/c", "npx vite --host"]` を使用
- `npm` や `bash` は `spawn ENOENT` / `spawn EINVAL` エラーになるため不可
