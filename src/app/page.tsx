'use client';

import SwiftPlayground from '@/components/SwiftPlayground';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-blue-600">SwiftWasm</div>
              <div className="text-sm text-gray-500">Playground</div>
            </div>
            <nav className="flex space-x-6">
              <a href="#playground" className="text-gray-600 hover:text-blue-600 transition-colors">
                プレイグラウンド
              </a>
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                機能
              </a>
              <a href="#docs" className="text-gray-600 hover:text-blue-600 transition-colors">
                ドキュメント
              </a>
              <a href="https://github.com/swiftwasm/swift" target="_blank" className="text-gray-600 hover:text-blue-600 transition-colors">
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            ブラウザで<span className="text-blue-600">Swift</span>を実行
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            <strong>SwiftWasm</strong>は、あなたの<strong>Swift</strong>コードを<strong>WebAssembly</strong>にコンパイルします。
            <br />
            サーバーなしで、直接ブラウザでSwiftプログラムを動かしましょう。
          </p>
          <div className="flex justify-center space-x-4">
            <a href="#playground" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              今すぐ試す
            </a>
            <a href="#features" className="bg-white text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors">
              詳しく見る
            </a>
          </div>
        </div>
      </section>

      {/* 機能セクション */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            SwiftWasmの特徴
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">高速実行</h3>
              <p className="text-gray-600">
                WebAssemblyの高速実行により、ネイティブに近いパフォーマンスでSwiftコードを実行できます。
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">クロスプラットフォーム</h3>
              <p className="text-gray-600">
                どのモダンブラウザでも動作し、サーバーサイドの設定なしでSwiftアプリケーションを実行できます。
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💻</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">リアルタイムコンパイル</h3>
              <p className="text-gray-600">
                ブラウザ内でSwiftコードを直接WebAssemblyにコンパイルし、即座に実行結果を確認できます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* プレイグラウンドセクション */}
      <section id="playground" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              SwiftをWebAssemblyで今すぐ試す
            </h2>
            <p className="text-lg text-gray-600">
              クラウドでSwiftをコンパイルし、ブラウザで実行します。
            </p>
          </div>
          <SwiftPlayground />
        </div>
      </section>

      {/* 貢献セクション */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            プロジェクトへの貢献
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-blue-600">💰 開発をサポート</h3>
              <p className="text-gray-600 mb-4">
                SwiftWasm組織は、プロジェクトの持続可能な開発を続けるための資金を必要としています。
              </p>
              <div className="flex space-x-3">
                <a href="https://github.com/sponsors/swiftwasm" target="_blank" className="text-blue-600 hover:text-blue-800">
                  GitHub Sponsors
                </a>
                <span className="text-gray-400">|</span>
                <a href="https://opencollective.com/swiftwasm" target="_blank" className="text-blue-600 hover:text-blue-800">
                  Open Collective
                </a>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-green-600">🐛 課題を解決</h3>
              <p className="text-gray-600 mb-4">
                SwiftWasmは早期採用の段階にあり、まだ広範囲なテストと改善が必要です。
              </p>
              <a href="https://github.com/swiftwasm/swift/issues" target="_blank" className="text-blue-600 hover:text-blue-800">
                未解決の課題を見る
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">SwiftWasm</h3>
              <p className="text-gray-400">
                ブラウザでSwiftを実行するためのWebAssemblyコンパイラ
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">リンク</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://swiftwasm.org/" target="_blank" className="hover:text-white">公式サイト</a></li>
                <li><a href="https://github.com/swiftwasm/swift" target="_blank" className="hover:text-white">GitHub</a></li>
                <li><a href="https://discord.gg/ashpPe4" target="_blank" className="hover:text-white">Discord</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">ドキュメント</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://book.swiftwasm.org/" target="_blank" className="hover:text-white">SwiftWasm Book</a></li>
                <li><a href="https://github.com/swiftwasm/JavaScriptKit" target="_blank" className="hover:text-white">JavaScriptKit</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">コミュニティ</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://twitter.com/swiftwasm" target="_blank" className="hover:text-white">Twitter</a></li>
                <li><a href="https://forums.swift.org/c/development/webassembly" target="_blank" className="hover:text-white">Swift Forums</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SwiftWasm Project. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
