'use client';

import React, { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { examples } from '../data/examples';
import { compileSwiftCode, executeWasm } from '../utils/compiler';

interface DebugInfo {
  timestamp: string;
  checks: {
    swiftVersion?: { status: string; output?: string; error?: string };
    swiftSdks?: { status: string; output?: string; error?: string; hasWasmSdk?: boolean };
    environment?: Record<string, string | undefined>;
    wasmSdkInstalled?: { status: string; output?: string; error?: string };
  };
}

export default function SwiftPlayground() {
  const [code, setCode] = useState(examples[0].code);

  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [compilerReady, setCompilerReady] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loadingDebug, setLoadingDebug] = useState(false);

  useEffect(() => {
    // API Routeの準備状況を確認
    fetch('/api/debug')
      .then(response => {
        if (response.ok) {
          setCompilerReady(true);
        }
      })
      .catch(() => {
        setError('SwiftWasmコンパイラAPI routeに接続できません。');
      });
  }, []);

  const runCode = async () => {
    if (!compilerReady) {
      setError('SwiftWasmコンパイラが利用できません');
      return;
    }

    setIsRunning(true);
    setError('');
    setOutput('');

    try {
      await compileAndRunSwift();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const compileAndRunSwift = async () => {
    setOutput('');
    
    try {
      // SwiftコードをWebAssemblyにコンパイル
      const result = await compileSwiftCode(code);

      if (!result.success) {
        throw new Error(`コンパイルエラー:\n${result.error || '不明なエラー'}`);
      }

      if (!result.wasmBase64) {
        throw new Error('WebAssemblyバイナリが生成されませんでした');
      }

      // Base64からWebAssemblyバイナリをデコード
      const wasmBytes = Uint8Array.from(atob(result.wasmBase64), c => c.charCodeAt(0));

      // WebAssemblyモジュールを実行
      await executeWasm(wasmBytes, setOutput);
    } catch (error) {
      throw new Error(`SwiftWasm実行エラー: ${(error as Error).message}`);
    }
  };



  const clearOutput = () => {
    setOutput('');
    setError('');
  };

  const loadExample = (exampleCode: string) => {
    setCode(exampleCode);
    clearOutput();
  };

  const fetchDebugInfo = async () => {
    setLoadingDebug(true);
    try {
      const response = await fetch('/api/debug');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('デバッグ情報の取得に失敗しました:', error);
      setDebugInfo({
        timestamp: new Date().toISOString(),
        checks: {
          swiftVersion: { status: 'error', error: 'デバッグ情報の取得に失敗' }
        }
      });
    } finally {
      setLoadingDebug(false);
    }
  };

  const toggleDebugInfo = async () => {
    if (!debugInfo) {
      await fetchDebugInfo();
    }
    setShowDebugInfo(true);
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800">
              🚀 Real SwiftWasm Playground
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">
                {!compilerReady ? 
                  '❌ コンパイラAPI route未接続' :
                  '✅ SwiftWasmコンパイラ準備完了'}
              </p>
              {compilerReady && (
                <button
                  onClick={toggleDebugInfo}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  disabled={loadingDebug}
                >
                  {loadingDebug ? '🔄' : '🔍'} デバッグ情報
                </button>
              )}
            </div>
            

          </div>
          <div className="space-x-2">
            <button
              onClick={clearOutput}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              disabled={isRunning}
            >
              クリア
            </button>
            <button
              onClick={runCode}
              disabled={isRunning || !compilerReady}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {isRunning ? '🔄 コンパイル中...' : '▶️ 実行'}
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 mr-2">サンプル:</span>
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => loadExample(example.code)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
            >
              {example.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        <div className="border-r border-gray-200">
          <Editor
            height="100%"
            defaultLanguage="swift"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        <div className="bg-gray-900 text-white p-4 overflow-auto">
          <div className="mb-2">
            <span className="text-green-400 font-semibold">出力:</span>
          </div>
          {isRunning && (
            <div className="text-yellow-400">🔄 SwiftWasmコンパイラでコンパイル中...</div>
          )}
          {error && (
            <div className="text-red-400 mb-2">
              <span className="font-semibold">❌ エラー:</span>
              <pre className="whitespace-pre-wrap mt-1">{error}</pre>
            </div>
          )}
          {output && (
            <div className="text-gray-200">
              <pre className="whitespace-pre-wrap">{output}</pre>
            </div>
          )}
          {!isRunning && !error && !output && (
            <div className="text-gray-500 italic">
              「▶️ 実行」ボタンまたはサンプルを選んでSwiftコードを実行してください
              <br/>
              <br/>
              💡 このプレイグラウンドはSwiftWasmコンパイラ（Swift 6.1）を使用しています
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-2 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <strong>🚀 Real SwiftWasm Playground</strong> - 
          <a href="https://github.com/swiftwasm/swift" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">SwiftWasm</a>コンパイラ（Swift 6.1）でWebAssemblyにコンパイル・実行
        </div>
      </div>

      {/* デバッグ情報ポップアップ */}
      {showDebugInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">🔍 SwiftWasm デバッグ情報</h3>
              <button
                onClick={() => setShowDebugInfo(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {debugInfo ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-500">
                    最終更新: {new Date(debugInfo.timestamp).toLocaleString()}
                  </div>
                  
                  {debugInfo.checks.swiftVersion && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Swift バージョン</h4>
                      <div className={`text-sm ${debugInfo.checks.swiftVersion.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {debugInfo.checks.swiftVersion.status === 'success' 
                          ? debugInfo.checks.swiftVersion.output 
                          : `❌ ${debugInfo.checks.swiftVersion.error}`}
                      </div>
                    </div>
                  )}
                  
                  {debugInfo.checks.swiftSdks && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Swift SDKs for WebAssembly</h4>
                      <div className={`text-sm ${debugInfo.checks.swiftSdks.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {debugInfo.checks.swiftSdks.status === 'success' ? (
                          <div>
                            <div className="mb-1">
                              {debugInfo.checks.swiftSdks.hasWasmSdk ? '✅' : '❌'} WASM SDK利用可能
                            </div>
                            <div className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                              {debugInfo.checks.swiftSdks.output}
                            </div>
                          </div>
                        ) : (
                          `❌ ${debugInfo.checks.swiftSdks.error}`
                        )}
                      </div>
                    </div>
                  )}
                  

                  
                  {debugInfo.checks.environment && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">実行環境</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><strong>プラットフォーム:</strong> {debugInfo.checks.environment.platform}</div>
                        <div><strong>アーキテクチャ:</strong> {debugInfo.checks.environment.arch}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">デバッグ情報を読み込み中...</div>
                </div>
              )}
            </div>
            
            <div className="border-t p-4 bg-gray-50">
              <button
                onClick={() => setShowDebugInfo(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 