# Node.js 20を使用
FROM node:20-slim

# アーキテクチャを取得
ARG TARGETARCH
ARG TARGETPLATFORM

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y \
    curl \
    xz-utils \
    unzip \
    build-essential \
    ca-certificates \
    libncurses6 \
    libncurses-dev \
    libtinfo6 \
    libxml2 \
    libz3-4 \
    libedit2 \
    libsqlite3-0 \
    libc6-dev \
    libgcc-s1 \
    libuuid1 \
    libicu-dev \
    tzdata \
    git \
    && rm -rf /var/lib/apt/lists/*

# Swift 6.1を直接インストール（アーキテクチャ別対応）
RUN mkdir -p /opt/swift && \
    if [ "$TARGETARCH" = "arm64" ]; then \
        curl -L https://download.swift.org/swift-6.1-release/ubuntu2204-aarch64/swift-6.1-RELEASE/swift-6.1-RELEASE-ubuntu22.04-aarch64.tar.gz | tar -xz -C /opt/swift --strip-components=1; \
    else \
        curl -L https://download.swift.org/swift-6.1-release/ubuntu2204/swift-6.1-RELEASE/swift-6.1-RELEASE-ubuntu22.04.tar.gz | tar -xz -C /opt/swift --strip-components=1; \
    fi
ENV PATH="/opt/swift/usr/bin:$PATH"

# ライブラリの依存関係を確認し、必要に応じてシンボリックリンクを作成
RUN ldconfig && \
    swift --version || (echo "Swift installation verification failed" && exit 1)

# SwiftWasm SDK をインストール
RUN swift sdk install "https://github.com/swiftwasm/swift/releases/download/swift-wasm-6.1-RELEASE/swift-wasm-6.1-RELEASE-wasm32-unknown-wasi.artifactbundle.zip" --checksum "7550b4c77a55f4b637c376f5d192f297fe185607003a6212ad608276928db992"

# 作業ディレクトリを設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci

# アプリケーションファイルをコピー
COPY . .

# Next.jsをビルド
RUN npm run build

# ポート3000を公開
EXPOSE 3000

# アプリケーションを起動
CMD ["npm", "start"] 