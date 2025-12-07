
# 🚀 Tauri デスクトップアプリ 配布ガイド

このドキュメントは、本プロジェクトを**実行ファイル（.exe / .dmg / .deb）としてビルドし、配布するための手順**です。

## 🛠 前提条件 (Prerequisites)

ビルドを行うローカル環境には以下が必要です。

1.  **Node.js**: v20以上推奨
2.  **Rust**: インストール必須（Tauriのバックエンドコンパイルに使用）
    *   確認: `rustc --version`
    *   未インストールの場合: https://rustup.rs/ からインストール

---

## 📦 配布用ビルド手順 (Production Build Flow)

以下の手順を順番に実行してください。

### 1. アプリアイコンの生成 (重要)

現在の `public/icon.svg` を元に、Windows(.ico)、Mac(.icns)、Linux(.png) 用のアイコンセットを自動生成します。これを行わないと、デフォルトのTauriアイコンになります。

```bash
npm run tauri:icon
```
*   成功すると、`src-tauri/icons/` フォルダ内の画像が上書き更新されます。

### 2. ビルドコマンドの実行

以下のコマンドで、フロントエンドのビルドとRustバックエンドのコンパイルを行い、インストーラーを生成します。

```bash
npm run tauri:build
```

*   **初回は時間がかかります**（数分〜十数分）。
*   エラーが出る場合、Rustが正しくインストールされているか確認してください。

### 3. 生成されたファイルの確認

ビルドが成功すると、以下のパスに実行ファイルが生成されます。

#### Windows の場合
*   **インストーラー**: `src-tauri/target/release/bundle/nsis/Hello World, Good-bye Unit_1.0.0_x64-setup.exe`
*   **実行ファイル単体**: `src-tauri/target/release/Hello World, Good-bye Unit.exe`

#### macOS の場合
*   **ディスクイメージ**: `src-tauri/target/release/bundle/dmg/Hello World, Good-bye Unit_1.0.0_x64.dmg`
*   **アプリ本体**: `src-tauri/target/release/bundle/macos/Hello World, Good-bye Unit.app`

---

## 🔑 APIキーの認証について (重要)

本アプリは配布用ビルドでは環境変数(`.env`)を含みません。そのため、アプリには**APIキー設定機能**が組み込まれています。

1.  ユーザーが配布されたアプリを初回起動すると、**「SYSTEM AUTH」**画面が表示されます。
2.  ユーザーは自身の Google Gemini APIキーを入力する必要があります。
3.  入力されたキーはユーザーのローカル環境(`localStorage`)に保存され、外部サーバーへは送信されません。

開発者自身が配布版を利用する場合も、起動後に手動でAPIキーを入力してください。

---

## 🔧 設定のカスタマイズ

アプリ名やバージョンを変更したい場合は、以下のファイルを編集してください。

### `src-tauri/tauri.conf.json`

```json
{
  "productName": "アプリ名",
  "version": "1.0.0", 
  "identifier": "com.yourname.app",
  "bundle": {
      "copyright": "© 2025 ..."
  }
}
```
*   **注意**: `version` を変更した場合は、`package.json` の `version` も合わせて変更することを推奨します。

---

## 📊 トラブルシューティング

**Q. ビルド中に "resource not found" エラーが出る**
A. `npm run tauri:icon` を実行してアイコンを生成しましたか？

**Q. Windowsでビルドできない**
A. 「C++ Build Tools」が必要です。Visual Studio Installerから「C++によるデスクトップ開発」をインストールしてください。

**Q. 起動しても真っ白になる**
A. フロントエンドのビルドに失敗している可能性があります。 `dist` フォルダが生成されているか確認してください。また、`vite.config.ts` の `base` 設定が `'./'` (相対パス) になっていることを確認してください（自動設定されます）。
