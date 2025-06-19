'use client';

import React, { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';

interface CompileResponse {
  success: boolean;
  wasmBase64?: string;
  error?: string;
  output?: string;
}

export default function SwiftPlayground() {
  const [code, setCode] = useState(`print("🚀 Hello from SwiftWasm!")
print("Swiftコードが実行されています！")

let message = "SwiftWasmでWebAssemblyプログラミング"
print(message)

let numbers = [1, 2, 3, 4, 5]
let sum = numbers.reduce(0, +)
print("配列の合計: \\(sum)")`);

  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [compilerReady, setCompilerReady] = useState(false);

  useEffect(() => {
    // API Routeの準備状況を確認
    fetch('/api')
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
    setOutput('🔄 SwiftWasmコンパイラでコンパイル中...\n\n');
    
    try {
      // SwiftコードをWebAssemblyにコンパイル
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error(`コンパイラAPI routeエラー: ${response.status}`);
      }

      const result: CompileResponse = await response.json();

      if (!result.success) {
        throw new Error(`コンパイルエラー:\n${result.error || '不明なエラー'}`);
      }

      if (!result.wasmBase64) {
        throw new Error('WebAssemblyバイナリが生成されませんでした');
      }

      setOutput(prev => prev + '✅ コンパイル完了\n🔄 WebAssemblyモジュールを実行中...\n\n');

      // Base64からWebAssemblyバイナリをデコード
      const wasmBytes = Uint8Array.from(atob(result.wasmBase64), c => c.charCodeAt(0));

      // WebAssemblyモジュールを実行
      await executeWasm(wasmBytes);

      setOutput(prev => prev + '\n✅ 実行完了\n');
    } catch (error) {
      throw new Error(`SwiftWasm実行エラー: ${(error as Error).message}`);
    }
  };

  const executeWasm = async (wasmBytes: Uint8Array) => {
    // WASIの基本的な実装
    const wasiImports = {
      wasi_snapshot_preview1: {
        fd_write: (fd: number, iovs: number, iovsLen: number, nwritten: number) => {
          if (fd === 1 || fd === 2) { // stdout or stderr
            const memory = (instance.exports.memory as WebAssembly.Memory);
            const buffer = new Uint8Array(memory.buffer);
            
            let totalWritten = 0;
            for (let i = 0; i < iovsLen; i++) {
              const iovPtr = iovs + i * 8;
              const strPtr = new DataView(memory.buffer).getUint32(iovPtr, true);
              const strLen = new DataView(memory.buffer).getUint32(iovPtr + 4, true);
              
              const str = new TextDecoder().decode(buffer.slice(strPtr, strPtr + strLen));
              setOutput(prev => prev + str);
              totalWritten += strLen;
            }
            
            // nwrittenにtotalWrittenを書き込み
            new DataView(memory.buffer).setUint32(nwritten, totalWritten, true);
            return 0;
          }
          return -1;
        },
        fd_close: () => 0,
        fd_seek: () => 0,
        proc_exit: (code: number) => {
          if (code !== 0) {
            setOutput(prev => prev + `\nプロセスが終了コード ${code} で終了しました\n`);
          }
        },
        environ_sizes_get: (environCount: number, environBufSize: number) => {
          const memory = (instance.exports.memory as WebAssembly.Memory);
          new DataView(memory.buffer).setUint32(environCount, 0, true);
          new DataView(memory.buffer).setUint32(environBufSize, 0, true);
          return 0;
        },
        environ_get: () => 0,
        args_sizes_get: (argCount: number, argBufSize: number) => {
          const memory = (instance.exports.memory as WebAssembly.Memory);
          new DataView(memory.buffer).setUint32(argCount, 0, true);
          new DataView(memory.buffer).setUint32(argBufSize, 0, true);
          return 0;
        },
        args_get: () => 0,
        clock_time_get: () => 0,
        random_get: (buf: number, bufLen: number) => {
          const memory = (instance.exports.memory as WebAssembly.Memory);
          const buffer = new Uint8Array(memory.buffer, buf, bufLen);
          crypto.getRandomValues(buffer);
          return 0;
        },
        fd_fdstat_get: (fd: number, stat: number) => {
          // ファイルディスクリプタの統計情報を設定
          const memory = (instance.exports.memory as WebAssembly.Memory);
          const view = new DataView(memory.buffer);
          
          // fdstat構造体のフィールドを設定
          view.setUint8(stat, 0); // fs_filetype: unknown
          view.setUint16(stat + 2, 0, true); // fs_flags
          view.setBigUint64(stat + 8, BigInt(0), true); // fs_rights_base
          view.setBigUint64(stat + 16, BigInt(0), true); // fs_rights_inheriting
          
          return 0;
        },
        fd_prestat_get: () => 8, // EBADF: Bad file descriptor
        fd_prestat_dir_name: () => 8, // EBADF: Bad file descriptor
        path_open: () => 76, // ENOTCAPABLE: Insufficient rights
        fd_read: () => 8, // EBADF: Bad file descriptor
        fd_readdir: () => 8, // EBADF: Bad file descriptor
        fd_filestat_get: () => 8, // EBADF: Bad file descriptor
        path_filestat_get: () => 76, // ENOTCAPABLE: Insufficient rights
        poll_oneoff: () => 52, // ENOSYS: Function not implemented
      }
    };

    let instance: WebAssembly.Instance;
    
    try {
      const wasmModule = await WebAssembly.compile(wasmBytes);
      instance = await WebAssembly.instantiate(wasmModule, wasiImports);
      
      // _startを実行
      if (instance.exports._start) {
        (instance.exports._start as (() => void))();
      } else {
        throw new Error('WebAssemblyモジュールに_start関数が見つかりません');
      }
    } catch (error) {
      throw new Error(`WebAssembly実行エラー: ${(error as Error).message}`);
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

  const examples = [
    {
      name: 'Hello SwiftWasm',
      code: `print("🚀 Hello, SwiftWasm!")
print("Swiftがブラウザで動作中！")

let message = "WebAssemblyでSwiftを実行"
print(message)`
    },
    {
      name: '配列操作',
      code: `let fruits = ["🍎", "🍌", "🍊"]
print("果物: \\(fruits)")

let numbers = [1, 2, 3, 4, 5]
let doubled = numbers.map { $0 * 2 }
print("元の配列: \\(numbers)")
print("2倍: \\(doubled)")

let sum = numbers.reduce(0, +)
print("合計: \\(sum)")`
    },
    {
      name: '文字列処理',
      code: `let greeting = "こんにちは"
let name = "SwiftWasm"
let version = "6.1"

print("\\(greeting), \\(name) \\(version)!")

let message = greeting + ", " + name + "の世界へようこそ！"
print(message)`
    },
    {
      name: 'Swift標準ライブラリ',
      code: `// Swift標準ライブラリの機能をデモ
print("🔢 数値演算:")
let a = 42
let b = 24
print("\\(a) + \\(b) = \\(a + b)")

print("\\n📊 配列操作:")
let data = [10, 20, 30, 40, 50]
print("データ: \\(data)")
print("最大値: \\(data.max() ?? 0)")
print("平均値: \\(data.reduce(0, +) / data.count)")`
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              🚀 Real SwiftWasm Playground
            </h2>
            <p className="text-sm text-gray-600">
              {!compilerReady ? 
                '❌ コンパイラAPI route未接続' :
                '✅ SwiftWasmコンパイラ準備完了'}
            </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 h-96">
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

      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <strong>🚀 Real SwiftWasm Playground</strong><br/>
          このプレイグラウンドは実際の<a href="https://github.com/swiftwasm/swift" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">SwiftWasm</a>コンパイラ（Swift 6.1）を使用してSwiftコードをWebAssemblyにコンパイルし、ブラウザで実行します。
          サーバーサイドでコンパイルされたWebAssemblyバイナリを受け取り、ブラウザ内のWASIランタイムで実行します。
        </div>
      </div>
    </div>
  );
} 