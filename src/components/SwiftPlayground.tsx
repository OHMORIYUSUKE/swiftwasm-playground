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
        clock_time_get: (id: number, precision: bigint, time: number) => {
          const memory = (instance.exports.memory as WebAssembly.Memory);
          const now = BigInt(Date.now() * 1000000); // ナノ秒に変換
          new DataView(memory.buffer).setBigUint64(time, now, true);
          return 0;
        },
        clock_res_get: (id: number, resolution: number) => {
          const memory = (instance.exports.memory as WebAssembly.Memory);
          // 1ミリ秒の解像度を設定（ナノ秒単位）
          new DataView(memory.buffer).setBigUint64(resolution, BigInt(1000000), true);
          return 0;
        },
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
        sched_yield: () => 0, // スケジューラにCPUを譲る
        fd_sync: () => 0, // ファイル同期（何もしない）
        fd_datasync: () => 0, // データ同期（何もしない）
        path_create_directory: () => 76, // ENOTCAPABLE: Insufficient rights
        path_remove_directory: () => 76, // ENOTCAPABLE: Insufficient rights
        path_unlink_file: () => 76, // ENOTCAPABLE: Insufficient rights
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
      code: `let fruits = ["🍎", "🍌", "🍊", "🍇", "🍓"]
print("果物: \\(fruits)")

let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
let doubled = numbers.map { $0 * 2 }
print("元の配列: \\(numbers)")
print("2倍: \\(doubled)")

let evenNumbers = numbers.filter { $0 % 2 == 0 }
print("偶数: \\(evenNumbers)")

let sum = numbers.reduce(0, +)
print("合計: \\(sum)")

// 高階関数の組み合わせ
let result = numbers
    .filter { $0 > 5 }
    .map { $0 * 3 }
    .reduce(0, +)
print("5より大きい数を3倍して合計: \\(result)")`
    },
    {
      name: '文字列処理',
      code: `let greeting = "こんにちは"
let name = "SwiftWasm"
let version = "6.1"

print("\\(greeting), \\(name) \\(version)!")

let message = greeting + ", " + name + "の世界へようこそ！"
print(message)

// 文字列の詳細操作
let text = "SwiftでWebAssemblyプログラミング"
print("文字数: \\(text.count)")
print("大文字: \\(text.uppercased())")

// 文字列の分割と結合
let words = text.components(separatedBy: " ")
print("単語: \\(words)")
let reversed = words.reversed().joined(separator: " ")
print("逆順: \\(reversed)")`
    },
    {
      name: 'クラスと構造体',
      code: `// 構造体の定義
struct Point {
    var x: Double
    var y: Double
    
    func distance(to other: Point) -> Double {
        let dx = x - other.x
        let dy = y - other.y
        return (dx * dx + dy * dy).squareRoot()
    }
}

let point1 = Point(x: 0, y: 0)
let point2 = Point(x: 3, y: 4)
print("点1: (\\(point1.x), \\(point1.y))")
print("点2: (\\(point2.x), \\(point2.y))")
print("距離: \\(point1.distance(to: point2))")

// クラスの定義
class Person {
    var name: String
    var age: Int
    
    init(name: String, age: Int) {
        self.name = name
        self.age = age
    }
    
    func introduce() -> String {
        return "私は\\(name)、\\(age)歳です"
    }
}

let person = Person(name: "太郎", age: 25)
print(person.introduce())`
    },
    {
      name: 'Optional型',
      code: `// Optional型の基本的な使い方
var optionalName: String? = "Swift"
print("Optional値: \\(optionalName)")

// Optional Binding
if let name = optionalName {
    print("名前は \\(name) です")
} else {
    print("名前がありません")
}

// Nil-coalescing operator
let defaultName = optionalName ?? "無名"
print("デフォルト名: \\(defaultName)")

// Optional Chaining
class Address {
    var street: String?
    var city: String?
}

class PersonWithAddress {
    var name: String
    var address: Address?
    
    init(name: String) {
        self.name = name
    }
}

let person = PersonWithAddress(name: "花子")
person.address = Address()
person.address?.street = "銀座1-1-1"
person.address?.city = "東京"

print("住所: \\(person.address?.street ?? "不明") \\(person.address?.city ?? "不明")")`
    },
    {
      name: 'Enum（列挙型）',
      code: `// 基本的な列挙型
enum Direction {
    case north
    case south
    case east
    case west
}

let direction = Direction.north
print("方向: \\(direction)")

// Associated Values付きの列挙型
enum Shape {
    case circle(radius: Double)
    case rectangle(width: Double, height: Double)
    case triangle(base: Double, height: Double)
}

let shapes: [Shape] = [
    .circle(radius: 5.0),
    .rectangle(width: 10.0, height: 8.0),
    .triangle(base: 6.0, height: 4.0)
]

for shape in shapes {
    switch shape {
    case .circle(let radius):
        let area = 3.14159 * radius * radius
        print("円の面積: \\(area)")
    case .rectangle(let width, let height):
        let area = width * height
        print("四角形の面積: \\(area)")
    case .triangle(let base, let height):
        let area = base * height / 2
        print("三角形の面積: \\(area)")
    }
}`
    },
    {
      name: 'プロトコル',
      code: `// プロトコルの定義
protocol Drawable {
    func draw() -> String
}

// プロトコルに準拠する構造体
struct Circle: Drawable {
    let radius: Double
    
    func draw() -> String {
        return "半径\\(radius)の円を描画"
    }
}

struct Rectangle: Drawable {
    let width: Double
    let height: Double
    
    func draw() -> String {
        return "幅\\(width)×高さ\\(height)の四角形を描画"
    }
}

// プロトコル型として使用
let shapes: [Drawable] = [
    Circle(radius: 5.0),
    Rectangle(width: 10.0, height: 8.0),
    Circle(radius: 3.0)
]

for shape in shapes {
    print(shape.draw())
}

// プロトコル拡張
extension Drawable {
    func describe() -> String {
        return "これは描画可能な図形です: \\(draw())"
    }
}

for shape in shapes {
    print(shape.describe())
}`
    },
    {
      name: 'ジェネリクス',
      code: `// ジェネリック関数
func swapValues<T>(_ a: inout T, _ b: inout T) {
    let temp = a
    a = b
    b = temp
}

var x = 10
var y = 20
print("交換前: x=\\(x), y=\\(y)")
swapValues(&x, &y)
print("交換後: x=\\(x), y=\\(y)")

var str1 = "Hello"
var str2 = "World"
print("交換前: str1=\\(str1), str2=\\(str2)")
swapValues(&str1, &str2)
print("交換後: str1=\\(str1), str2=\\(str2)")

// ジェネリック型
struct Stack<Element> {
    private var items: [Element] = []
    
    mutating func push(_ item: Element) {
        items.append(item)
    }
    
    mutating func pop() -> Element? {
        return items.isEmpty ? nil : items.removeLast()
    }
    
    func peek() -> Element? {
        return items.last
    }
    
    var count: Int {
        return items.count
    }
}

var intStack = Stack<Int>()
intStack.push(1)
intStack.push(2)
intStack.push(3)
print("スタック要素数: \\(intStack.count)")
print("トップ要素: \\(intStack.peek() ?? 0)")
print("ポップ: \\(intStack.pop() ?? 0)")`
    },
    {
      name: 'クロージャー',
      code: `// 基本的なクロージャー
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// map: 各要素を変換
let doubled = numbers.map { $0 * 2 }
print("2倍: \\(doubled)")

// filter: 条件に合う要素のみ抽出
let evenNumbers = numbers.filter { $0 % 2 == 0 }
print("偶数: \\(evenNumbers)")

// reduce: 要素を集約
let sum = numbers.reduce(0) { $0 + $1 }
print("合計: \\(sum)")

// sorted: ソート
let reversed = numbers.sorted { $0 > $1 }
print("降順: \\(reversed)")

// 複雑なクロージャーの例
let words = ["Swift", "WebAssembly", "プログラミング", "コンパイル"]
let processedWords = words
    .filter { $0.count > 4 }
    .map { $0.uppercased() }
    .sorted()

print("処理済み単語: \\(processedWords)")

// trailing closure syntax
func performOperation(_ a: Int, _ b: Int, operation: (Int, Int) -> Int) -> Int {
    return operation(a, b)
}

let result = performOperation(10, 5) { $0 + $1 }
print("演算結果: \\(result)")`
    },
    {
      name: 'エラーハンドリング',
      code: `// エラー型の定義
enum CalculationError: Error {
    case divisionByZero
    case negativeSquareRoot
}

// エラーをthrowする関数
func divide(_ a: Double, by b: Double) throws -> Double {
    guard b != 0 else {
        throw CalculationError.divisionByZero
    }
    return a / b
}

func squareRoot(of number: Double) throws -> Double {
    guard number >= 0 else {
        throw CalculationError.negativeSquareRoot
    }
    return number.squareRoot()
}

// do-catch文でエラーハンドリング
do {
    let result1 = try divide(10, by: 2)
    print("10 ÷ 2 = \\(result1)")
    
    let result2 = try squareRoot(of: 16)
    print("√16 = \\(result2)")
    
    // エラーが発生するケース
    let result3 = try divide(10, by: 0)
    print("これは表示されません")
} catch CalculationError.divisionByZero {
    print("エラー: ゼロで割ることはできません")
} catch CalculationError.negativeSquareRoot {
    print("エラー: 負の数の平方根は計算できません")
} catch {
    print("未知のエラー: \\(error)")
}

// try?とtry!の使用例
let safeResult = try? divide(8, by: 2)
print("安全な結果: \\(safeResult ?? 0)")`
    },
    {
      name: '関数型プログラミング',
      code: `// 高階関数の組み合わせ
let numbers = Array(1...20)

// 複雑な処理のチェーン
let result = numbers
    .filter { $0 % 2 == 1 }        // 奇数のみ
    .map { $0 * $0 }               // 二乗
    .filter { $0 < 100 }           // 100未満
    .reduce(0, +)                  // 合計

print("1-20の奇数の二乗で100未満の合計: \\(result)")

// カスタム高階関数
func compose<A, B, C>(_ f: @escaping (B) -> C, _ g: @escaping (A) -> B) -> (A) -> C {
    return { a in f(g(a)) }
}

let addOne = { (x: Int) -> Int in x + 1 }
let multiplyByTwo = { (x: Int) -> Int in x * 2 }

let addOneThenMultiplyByTwo = compose(multiplyByTwo, addOne)
print("5に1足して2倍: \\(addOneThenMultiplyByTwo(5))")

// flatMap の使用例
let nestedArrays = [[1, 2], [3, 4], [5, 6]]
let flattened = nestedArrays.flatMap { $0 }
print("平坦化: \\(flattened)")

// compactMap の使用例（nilを除去）
let strings = ["1", "2", "hello", "4", "world"]
let integers = strings.compactMap { Int($0) }
print("数値のみ: \\(integers)")`
    },
    {
      name: 'アルゴリズムとデータ構造',
      code: `// バブルソート
func bubbleSort(_ array: [Int]) -> [Int] {
    var result = array
    let n = result.count
    
    for i in 0..<n {
        for j in 0..<(n - i - 1) {
            if result[j] > result[j + 1] {
                let temp = result[j]
                result[j] = result[j + 1]
                result[j + 1] = temp
            }
        }
    }
    return result
}

let unsorted = [64, 34, 25, 12, 22, 11, 90]
print("ソート前: \\(unsorted)")
let sorted = bubbleSort(unsorted)
print("ソート後: \\(sorted)")

// フィボナッチ数列（再帰版）
func fibonacci(_ n: Int) -> Int {
    if n <= 1 {
        return n
    }
    return fibonacci(n - 1) + fibonacci(n - 2)
}

print("フィボナッチ数列:")
for i in 0...10 {
    print("F(\\(i)) = \\(fibonacci(i))")
}

// 最大公約数（ユークリッドの互除法）
func gcd(_ a: Int, _ b: Int) -> Int {
    if b == 0 {
        return a
    }
    return gcd(b, a % b)
}

let num1 = 48
let num2 = 18
print("\\(num1)と\\(num2)の最大公約数: \\(gcd(num1, num2))")`
    }
  ];

  return (
    <div className="h-screen bg-white flex flex-col">
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
    </div>
  );
} 