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

### 方法1: Docker（推奨）

#### 前提条件
- Docker
- Docker Compose

#### 実行手順
```bash
# リポジトリをクローン
git clone <repository-url>
cd swiftwasm-playground

# Dockerコンテナをビルドして起動
docker-compose up --build

# バックグラウンドで実行したい場合
docker-compose up -d --build
```

#### M1/M2 Mac (ARM64) ユーザー向け特別設定

Apple Silicon (M1/M2) Macをお使いの場合、以下の方法で実行してください：

**方法1: 環境変数設定（推奨）**
```bash
# M1/M2 Mac用（ARM64）
export DOCKER_DEFAULT_PLATFORM=linux/arm64
docker-compose up --build

# Intel Mac/PC用（x86_64）
export DOCKER_DEFAULT_PLATFORM=linux/amd64
docker-compose up --build
```

**方法2: .envファイルを作成**
```bash
# .env ファイルを作成
echo "DOCKER_DEFAULT_PLATFORM=linux/arm64" > .env
docker-compose up --build
```

**方法3: 一時的な環境変数設定**
```bash
# M1/M2 Mac用（一回限り）
DOCKER_DEFAULT_PLATFORM=linux/arm64 docker-compose up --build

# Intel Mac/PC用（一回限り）
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker-compose up --build
```

**技術詳細:**
- 公式のSwift 6.1オープンソース版を使用
- SwiftWasm SDK 6.1を自動インストール
- ARM64/x86_64両対応のマルチアーキテクチャビルド
- 新しいSDKベースのアプローチにより環境構築が簡素化

#### ブラウザでアクセス
```
http://localhost:3000
```

### 方法2: ローカル環境

#### 1. Swift環境のセットアップ

##### swiftlyのインストール（macOS）
```bash
curl -O https://download.swift.org/swiftly/darwin/swiftly.pkg
installer -pkg swiftly.pkg -target CurrentUserHomeDirectory
~/.swiftly/bin/swiftly init --quiet-shell-followup
. ~/.swiftly/env.sh
hash -r
```

##### Swift 6.1の設定
```bash
# プロジェクトディレクトリに移動
cd swiftwasm-playground
~/.swiftly/bin/swiftly use 6.1.2
export PATH="$HOME/.swiftly/bin:$PATH"
```

#### 2. SwiftWasm SDKのインストール
```bash
swift sdk install "https://github.com/swiftwasm/swift/releases/download/swift-wasm-6.1-RELEASE/swift-wasm-6.1-RELEASE-wasm32-unknown-wasi.artifactbundle.zip" --checksum "7550b4c77a55f4b637c376f5d192f297fe185607003a6212ad608276928db992"

# インストール確認
swift sdk list
# 出力: 6.1-RELEASE-wasm32-unknown-wasi
```

#### 3. Wasmtimeのインストール
```bash
curl https://wasmtime.dev/install.sh -sSf | bash
```

#### 4. プロジェクトの依存関係のインストール
```bash
npm install
```

## 🏃‍♂️ 実行

### Docker使用時
```bash
# 開発モードで起動
docker-compose up

# 停止
docker-compose down
```

### ローカル環境使用時
```bash
# 開発サーバーの起動
npm run dev
```

### ブラウザでアクセス
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

### Docker関連の問題

#### M1/M2 Mac でのアーキテクチャエラー
```bash
# エラー: Dynamic loader not found: /lib64/ld-linux-x86-64.so.2
# 解決策1: ARM64プラットフォームを指定
docker-compose up --build --platform linux/arm64

# 解決策2: 環境変数を設定
export DOCKER_DEFAULT_PLATFORM=linux/arm64
docker-compose up --build

# 解決策3: x86_64で実行（Rosetta 2使用）
docker-compose up --build --platform linux/amd64
```

#### Dockerビルドが失敗する
```bash
# キャッシュをクリアして再構築
docker-compose build --no-cache

# 古いイメージ・コンテナを削除
docker system prune -a
docker-compose down --volumes --remove-orphans
```

#### メモリ不足エラー
```bash
# Docker Desktop のリソース制限を増加
# Settings > Resources > Advanced で Memory を 4GB 以上に設定

# または docker-compose.yml で制限を調整
# mem_limit: 4g
```

### SwiftWasmコンパイラが見つからない（ローカル環境）
```bash
# PATHの確認
echo $PATH
# swiftlyの再設定
. ~/.swiftly/env.sh
export PATH="$HOME/.swiftly/bin:$PATH"
```

### SDKが見つからない（ローカル環境）
```bash
# SDKリストの確認
swift sdk list
# 再インストール
swift sdk install "https://github.com/swiftwasm/swift/releases/download/swift-wasm-6.1-RELEASE/swift-wasm-6.1-RELEASE-wasm32-unknown-wasi.artifactbundle.zip" --checksum "7550b4c77a55f4b637c376f5d192f297fe185607003a6212ad608276928db992"
```

### コンパイラサーバーに接続できない
- APIサーバーが起動していることを確認
- ポート3000が使用可能であることを確認
- CORSエラーの場合はAPIサーバーのCORS設定を確認
- Dockerの場合は `docker-compose logs app` でログを確認

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