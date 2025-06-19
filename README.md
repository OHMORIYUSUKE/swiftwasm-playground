# 🚀 Real SwiftWasm Playground

ブラウザでSwiftコードをリアルタイムでWebAssemblyにコンパイル・実行できるオンラインプレイグラウンドです。SwiftWasm SDK 6.1を使用して、Swift 6.1のコードをWebAssemblyに変換し、ブラウザ内のカスタムWASI実装で実行します。

## ✨ 特徴

- **SwiftWasm SDK 6.1** を使用したリアルタイムコンパイル
- **ブラウザ内WASI実行環境** でWebAssemblyモジュールを直接実行
- **Monaco Editor** による高機能なSwiftコードエディタ
- **豊富なサンプルコード** Swift標準ライブラリの様々な機能を試せる例
- **リアルタイム出力** コンパイルと実行の状況をリアルタイムで表示
- **Docker対応** マルチアーキテクチャ（ARM64/x86_64）対応の環境

## 🏗️ アーキテクチャ

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Next.js       │ ─────────────► │   Next.js       │
│   Frontend      │                │   API Routes    │
│                 │ ◄───────────── │                 │
│ - Monaco Editor │   WebAssembly  │ - SwiftWasm     │
│ - WASI Runtime  │   Binary       │   Compiler      │
│ - TypeScript    │                │ - Swift 6.1     │
└─────────────────┘                └─────────────────┘
```

### フロントエンド
- **Monaco Editor**: VS Codeと同じエディタエンジンによるSwiftコード編集
- **カスタムWASI実装**: WebAssembly System Interfaceの独自実装
- **TypeScript**: 型安全性を確保したReactコンポーネント
- **Tailwind CSS**: モダンでレスポンシブなUI

### バックエンド
- **Next.js API Routes**: サーバーサイドでのSwiftコンパイル処理
- **SwiftWasm SDK**: Swift 6.1コードをWebAssemblyに変換
- **Docker**: 隔離された安全なコンパイル環境
- **一時ファイル管理**: セキュアな一時ディレクトリでのパッケージ処理

## 📋 前提条件

### macOS（推奨）
- macOS 13.0以降
- Node.js 18以降
- Swift 6.1以降（オープンソース版）

### その他のプラットフォーム
- Linux（Ubuntu 20.04以降）
- Docker（推奨）

## 🚀 セットアップ

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

## 🏃‍♂️ 実行

```bash
# 開発モードで起動
docker-compose up

# 停止
docker-compose down
```

### ブラウザでアクセス
```
http://localhost:3000
```

## 🧪 動作確認

### Dockerでの動作確認
```bash
# アプリケーションの起動
docker-compose up --build

# ブラウザでテスト
open http://localhost:3000

# コンテナ内のログ確認
docker-compose logs app
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
1. フロントエンドからSwiftコードをNext.js API Routeに送信
2. サーバーサイドで一時ディレクトリにSwiftパッケージプロジェクトを作成
3. SwiftWasm SDK 6.1を使用してWebAssemblyにコンパイル
4. 生成されたWASMバイナリをBase64エンコードしてレスポンス
5. フロントエンドでWASMバイナリをデコードしてカスタムWASI環境で実行

### カスタムWASI実装
ブラウザでWebAssemblyを実行するために、以下のWASIシステムコールを実装：

- `fd_write`: 標準出力/エラー出力の処理
- `proc_exit`: プロセス終了の処理
- `environ_*`: 環境変数の処理
- `args_*`: コマンドライン引数の処理
- `clock_time_get`: 時刻取得
- `random_get`: 暗号学的安全な乱数生成
- `fd_fdstat_get`: ファイルディスクリプタ統計情報

### 技術スタック
- **フロントエンド**: Next.js 15, React 19, TypeScript, Monaco Editor, Tailwind CSS
- **バックエンド**: Next.js API Routes, Node.js
- **コンパイラ**: SwiftWasm SDK 6.1, Swift 6.1
- **実行環境**: WebAssembly, カスタムWASI実装
- **インフラ**: Docker, Docker Compose（マルチアーキテクチャ対応）

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

### コンパイラAPIに接続できない
- Next.jsアプリケーションが起動していることを確認
- ポート3000が使用可能であることを確認
- API Routes（`/api/compile`）にアクセス可能であることを確認
- Dockerの場合は `docker-compose logs app` でログを確認
- ブラウザの開発者ツールでネットワークエラーをチェック

## 📖 参考資料

- [SwiftWasm公式サイト](https://swiftwasm.org/)
- [SwiftWasm Book](https://book.swiftwasm.org/)
- [SwiftWasm GitHub](https://github.com/swiftwasm/swift)
- [WebAssembly](https://webassembly.org/)
- [WASI](https://wasi.dev/)
