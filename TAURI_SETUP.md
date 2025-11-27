# 🚀 Tauri セットアップガイド

## ✅ 完了した作業
1. ✅ Tauri CLIのインストール
2. ✅ プロジェクトの初期化
3. ✅ 設定ファイルの最適化
4. ✅ ビルドスクリプトの追加

## ⚠️ 次のステップ: Rustのインストールが必要です

Tauriは**Rust**で書かれているため、Rustツールチェーンのインストールが必要です。

### Windowsでのインストール方法

#### 方法1: 公式インストーラー（推奨）
1. **Rustの公式サイト**にアクセス: https://rustup.rs/
2. `rustup-init.exe` をダウンロードして実行
3. インストーラーの指示に従う（デフォルト設定で問題なし）
4. インストール後、PowerShellを**再起動**

#### 方法2: PowerShellから直接インストール
```powershell
# 管理者権限不要
Invoke-WebRequest -Uri https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
.\rustup-init.exe
```

### インストール確認
```bash
# Rustのバージョン確認
rustc --version

# Cargoのバージョン確認
cargo --version
```

---

## 📦 インストール後の開発フロー

### 開発モード（ホットリロード付き）
```bash
npm run tauri:dev
```
- Viteの開発サーバーとTauriアプリが同時に起動
- コード変更が即座に反映

### プロダクションビルド（EXEファイル生成）
```bash
npm run tauri:build
```
- 生成される場所: `src-tauri/target/release/bundle/`
- **単一EXEファイル**: `nsis/` または `msi/` フォルダ内
- **初回ビルドは10-15分かかる場合があります**（依存関係のコンパイル）

---

## 🎮 ビジュアルノベルに最適化された設定

### ウィンドウサイズ
- デフォルト: 1280x800 (16:10比率)
- 最小サイズ: 800x600
- リサイズ可能、中央配置

### アプリケーション情報
- **製品名**: Hello World, Good-bye Unit
- **識別子**: com.hwgbu.app
- **バージョン**: 0.0.0 (package.jsonと同期推奨)

---

## 🔧 トラブルシューティング

### ビルドエラーが出る場合
```bash
# Rustツールチェーンの更新
rustup update

# Cargoキャッシュのクリア
cd src-tauri
cargo clean
```

### 既存のPWA機能との共存
- GitHub Pagesへのデプロイは引き続き `npm run deploy` で可能
- TauriとPWAは独立しており、両方を同時に提供できます

---

## 📊 ファイルサイズ比較

| 配布形式 | サイズ | 説明 |
|---------|--------|------|
| **Web (PWA)** | ~数MB | ブラウザで動作 |
| **Tauri EXE** | ~3-5MB | スタンドアロン実行可能 |
| **Electron** | ~50-100MB | 参考値 |

---

## 🎯 次のアクション
1. **Rustをインストール** → https://rustup.rs/
2. PowerShellを再起動
3. `npm run tauri:dev` でアプリを起動
4. 動作確認後、`npm run tauri:build` でEXE生成

---

ご不明な点があればお気軽にお尋ねください！
