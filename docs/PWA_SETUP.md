# PWA Configuration Update

## 概要
Vite の `base` 設定を使って、環境（開発/本番）に応じて自動的に `manifest.json` と `sw.js` を生成するように改善しました。

## 変更内容

### 追加ファイル
- `manifest.template.json` - manifest のテンプレート（`__BASE_URL__` プレースホルダーを含む）
- `sw.template.js` - Service Worker のテンプレート（`__BASE_URL__` プレースホルダーを含む）

### 更新ファイル
- `vite.config.ts` - `generatePWAAssets` プラグインを追加
  - ビルド時に `base` の値を使って manifest と SW を生成
  - 開発環境: `base = '/'`
  - 本番環境: `base = '/Hello-World-Good-bye-Unit/'`

## メリット

### 1. 環境別の自動対応
- **開発環境** (`npm run dev`): `http://localhost:3000/` でアクセス可能
- **本番環境** (GitHub Pages): `https://username.github.io/Hello-World-Good-bye-Unit/` でアクセス可能
- PWA のインストールと Service Worker が両方の環境で正しく動作します

### 2. メンテナンス性の向上
- リポジトリ名が変わっても、`vite.config.ts` の `base` を変更するだけで対応可能
- manifest と SW の内容が自動的に同期されます

### 3. 手動設定ミスの防止
- ハードコードされたパスを削除
- ビルド時に自動生成されるため、環境ごとの設定忘れがなくなります

## 使い方

### 開発時
```bash
npm run dev
# http://localhost:3000/ でアクセス
# manifest.json と sw.js は "/" ベースで動作
```

### 本番ビルド
```bash
npm run build
# dist/manifest.json と dist/sw.js が "/Hello-World-Good-bye-Unit/" ベースで生成される
```

### GitHub Pages へのデプロイ
```bash
npm run deploy
# または、main にマージすると GitHub Actions が自動デプロイ
```

## 技術詳細

### Vite プラグイン
`generatePWAAssets` プラグインは以下を実行します：
1. `manifest.template.json` を読み込み
2. `__BASE_URL__` を実際の `base` 値で置換
3. `manifest.json` として dist に出力
4. 同様に `sw.template.js` から `sw.js` を生成

### プレースホルダー
- `__BASE_URL__` - ビルド時に Vite の `base` 設定値で置換されます
  - 開発: `/`
  - 本番: `/Hello-World-Good-bye-Unit/`

## 注意事項

- 既存の `manifest.json` と `sw.js` は手動で編集しないでください（ビルド時に上書きされます）
- 変更が必要な場合は `manifest.template.json` と `sw.template.js` を編集してください
- ローカル開発時に PWA 機能をテストする場合は、HTTPS 環境が必要です（または localhost）
