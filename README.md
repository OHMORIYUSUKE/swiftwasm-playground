# 🚀 Real SwiftWasm Playground

[SwiftWasm.org](https://swiftwasm.org/)のようなSwiftWasmコンパイラを使用したオンラインプレイグラウンドです。

## ✨ 特徴

- **SwiftWasmコンパイラ（Swift 6.1）** を使用したリアルタイムコンパイル
- **ブラウザ内WASI実行環境** でWebAssemblyモジュールを直接実行
- **モダンなUI** SwiftWasm.orgにインスパイアされた美しいインターフェース
- **サンプルコード** Swift標準ライブラリの様々な機能を試せる例
- **リアルタイム出力** コンパイルと実行の状況をリアルタイムで表示

## 🏗️ アーキテクチャ

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Next.js       │ ─────────────► │   Vapor API     │
│   Frontend      │                │   Server        │
│                 │ ◄───────────── │                 │
│ - Monaco Editor │   WebAssembly  │ - SwiftWasm     │
│ - WASI Runtime  │   Binary       │   Compiler      │
│ - UI/UX         │                │ - Swift 6.1     │
└─────────────────┘                └─────────────────┘
```

### フロントエンド (Next.js + TypeScript)
- Monacoエディターを使用したSwiftコード編集
- ブラウザ内WASIランタイムでWebAssembly実行
- レスポンシブデザインとモダンなUI

### バックエンド (Vapor + Swift)
- SwiftWasmコンパイラを使用したリアルタイムコンパイル
- 一時ディレクトリでの安全なコンパイル環境
- Base64エンコードでのWebAssemblyバイナリ配信

## 📋 前提条件

### macOS（推奨）
- macOS 13.0以降
- Node.js 18以降
- Swift 6.1以降（オープンソース版）

### その他のプラットフォーム
- Linux（Ubuntu 20.04以降）
- Docker（推奨）

## 🚀 セットアップ

### 1. Swift環境のセットアップ

#### swiftlyのインストール（macOS）
```bash
curl -O https://download.swift.org/swiftly/darwin/swiftly.pkg
installer -pkg swiftly.pkg -target CurrentUserHomeDirectory
~/.swiftly/bin/swiftly init --quiet-shell-followup
. ~/.swiftly/env.sh
hash -r
```

#### Swift 6.1の設定
```bash
# プロジェクトディレクトリに移動
cd swiftwasm-playground
~/.swiftly/bin/swiftly use 6.1.2
export PATH="$HOME/.swiftly/bin:$PATH"
```

### 2. SwiftWasm SDKのインストール
```bash
swift sdk install "https://github.com/swiftwasm/swift/releases/download/swift-wasm-6.1-RELEASE/swift-wasm-6.1-RELEASE-wasm32-unknown-wasi.artifactbundle.zip" --checksum "7550b4c77a55f4b637c376f5d192f297fe185607003a6212ad608276928db992"

# インストール確認
swift sdk list
# 出力: 6.1-RELEASE-wasm32-unknown-wasi
```

### 3. Wasmtimeのインストール
```bash
curl https://wasmtime.dev/install.sh -sSf | bash
```

### 4. プロジェクトの依存関係のインストール

#### フロントエンド
```bash
npm install
```

#### バックエンド
```bash
cd swift-backend
# Vaporの依存関係は初回実行時に自動インストールされます
```

## 🏃‍♂️ 実行

### 1. バックエンドAPIサーバーの起動
```bash
cd swift-backend
export PATH="$HOME/.swiftly/bin:$PATH"
swift run swift-backend
```

### 2. フロントエンド開発サーバーの起動
```bash
# 新しいターミナルウィンドウで
npm run dev
```

### 3. ブラウザでアクセス
```
http://localhost:3000
```

## 🧪 テスト

### SwiftWasmコンパイラのテスト
```bash
# テストプロジェクトでコンパイル確認
mkdir test-swiftwasm && cd test-swiftwasm
swift package init --type executable
export PATH="$HOME/.swiftly/bin:$PATH"
swift build --swift-sdk 6.1-RELEASE-wasm32-unknown-wasi
wasmtime .build/wasm32-unknown-wasi/debug/test-swiftwasm.wasm
```

## 📚 使用方法

1. **コード編集**: 左側のMonacoエディターでSwiftコードを編集
2. **サンプル選択**: ヘッダーのサンプルボタンで様々な例を試す
3. **コンパイル実行**: 「▶️ 実行」ボタンでコンパイルと実行
4. **結果確認**: 右側の出力パネルで結果を確認

### サンプルコード

#### Hello SwiftWasm
```swift
print("🚀 Hello, SwiftWasm!")
print("Swiftがブラウザで動作中！")

let message = "WebAssemblyでSwiftを実行"
print(message)
```

#### 配列操作
```swift
let fruits = ["🍎", "🍌", "🍊"]
print("果物: \(fruits)")

let numbers = [1, 2, 3, 4, 5]
let doubled = numbers.map { $0 * 2 }
print("元の配列: \(numbers)")
print("2倍: \(doubled)")

let sum = numbers.reduce(0, +)
print("合計: \(sum)")
```

## 🔧 技術詳細

### コンパイルプロセス
1. フロントエンドからSwiftコードをAPIサーバーに送信
2. サーバーで一時ディレクトリにSwiftPackageプロジェクトを作成
3. SwiftWasm SDKを使用してWebAssemblyにコンパイル
4. 生成されたWASMバイナリをBase64エンコードしてレスポンス
5. フロントエンドでWASMバイナリをデコードしてWASI環境で実行

### WASI実装
- `fd_write`: 標準出力/エラー出力の処理
- `proc_exit`: プロセス終了の処理
- `environ_*`: 環境変数の処理
- `args_*`: コマンドライン引数の処理
- `random_get`: 乱数生成

## 🚨 トラブルシューティング

### SwiftWasmコンパイラが見つからない
```bash
# PATHの確認
echo $PATH
# swiftlyの再設定
. ~/.swiftly/env.sh
export PATH="$HOME/.swiftly/bin:$PATH"
```

### SDKが見つからない
```bash
# SDKリストの確認
swift sdk list
# 再インストール
swift sdk install "https://github.com/swiftwasm/swift/releases/download/swift-wasm-6.1-RELEASE/swift-wasm-6.1-RELEASE-wasm32-unknown-wasi.artifactbundle.zip" --checksum "7550b4c77a55f4b637c376f5d192f297fe185607003a6212ad608276928db992"
```

### コンパイラサーバーに接続できない
- APIサーバーが起動していることを確認
- ポート8080が使用可能であることを確認
- CORSエラーの場合はAPIサーバーのCORS設定を確認

## 📖 参考資料

- [SwiftWasm公式サイト](https://swiftwasm.org/)
- [SwiftWasm Book](https://book.swiftwasm.org/)
- [SwiftWasm GitHub](https://github.com/swiftwasm/swift)
- [WebAssembly](https://webassembly.org/)
- [WASI](https://wasi.dev/)

## 🤝 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は`LICENSE`ファイルを参照してください。

## 🙏 謝辞

- [SwiftWasm team](https://github.com/swiftwasm) - 素晴らしいSwiftWasmプロジェクト
- [Vapor](https://vapor.codes/) - 高速なSwift Webフレームワーク  
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 優秀なWebエディター
- [Next.js](https://nextjs.org/) - React Webフレームワーク

---

**SwiftWasmコンパイラでSwift for WebAssemblyプログラミングを楽しんでください！** 🚀

```sh
# 1. バックエンドAPI起動
cd swift-backend
export PATH="$HOME/.swiftly/bin:$PATH"
swift run swift-backend

# 2. フロントエンド起動（新しいターミナル）
npm run dev

# 3. ブラウザでアクセス
open http://localhost:3000
```