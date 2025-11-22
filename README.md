<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1yG2LboAdFPmDJlR49Hp5GMr67jkauOpt

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages

GitHub Actions による自動デプロイをサポートしています。`main` ブランチへ push するとビルドされ、GitHub Pages に公開されます。

### セットアップ手順
1. リポジトリ Settings > Pages を開き、"Build and deployment" で Source を `GitHub Actions` に設定します。
2. すでに `.github/workflows/deploy.yml` が存在するため追加設定は不要です。
3. `vite.config.ts` に `base: '/Hello-World-Good-bye-Unit/'` を設定済みです。ユーザ/Org Pages のルートで公開したい場合は `/` に変更してください。
4. 以下を push:
   ```bash
   git add .
   git commit -m "feat: enable github pages deployment"
   git push origin main
   ```

### ワークフローの概要
- 依存関係インストール: `npm ci`
- ビルド: `npm run build` (成果物は `dist/`)
- アーティファクトアップロード: `actions/upload-pages-artifact`
- 公開: `actions/deploy-pages`

### 公開URL
`https://yanagi-jabee-28.github.io/Hello-World-Good-bye-Unit/`

### トラブルシューティング
| 症状 | 原因 | 対処 |
| ---- | ---- | ---- |
| 404でアセットが参照できない | `base` 未設定 | `vite.config.ts` の `base` をリポジトリ名に合わせる |
| ビルド後に真っ白 | APIキー未設定 | `GEMINI_API_KEY` をリポジトリ Secrets か `.env` に設定 |
| ワークフロー失敗 (pages write権限不足) | permissions 設定不足 | `deploy.yml` の `permissions` が `pages: write` になっているか確認 |

### Secrets / 環境変数
GitHub Pages には Node サーバは存在しないため、すべてフロントエンド実行になります。`GEMINI_API_KEY` を公開したくない場合は **ブラウザ公開リスク** を理解した上でプロキシや serverless backend を導入してください。

