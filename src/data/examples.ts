export interface Example {
  name: string;
  code: string;
}

export const examples: Example[] = [
  {
    name: 'SwiftWasmバージョン情報',
    code: `// SwiftWasm 実行環境情報の表示

var swiftVersion = "不明"
#if swift(>=6.1)
swiftVersion = "6.1以上"
#elseif swift(>=6.0)
swiftVersion = "6.0以上"
#elseif swift(>=5.9)
swiftVersion = "5.9以上"
#else
swiftVersion = "5.9未満"
#endif

var platform = "不明"
#if os(WASI)
platform = "WASI (WebAssembly)"
#endif

var arch = "不明"
#if arch(wasm32)
arch = "WebAssembly 32-bit"
#endif

print("""
SwiftWasm 実行環境情報:
- Swiftバージョン: \(swiftVersion)
- プラットフォーム: \(platform)
- アーキテクチャ: \(arch)
- コンパイラ: SwiftWasm
""")`
  },
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
  },
  {
    name: '標準入力の使用',
    code: `// 標準入力から名前を読み取る
print("名前を入力してください:")
let name = readLine() ?? "匿名"
print("こんにちは、\\(name)さん！")

// 数値を入力して2倍にする
print("\\n数値を入力してください:")
if let input = readLine(), let number = Int(input) {
    let doubled = number * 2
    print("入力: \\(number), 2倍: \\(doubled)")
} else {
    print("有効な数値が入力されませんでした")
}`
  }
]; 