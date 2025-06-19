import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, mkdirSync, readFileSync, rmSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

// CORS設定
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface CompileRequest {
  code: string;
}

interface CompileResponse {
  success: boolean;
  output: string;
  error?: string;
  wasmBase64?: string;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// SwiftWasm対応のためのコード変換関数
function convertToSwiftWasmCompatible(code: string): string {
  let convertedCode = code;
  
  // Foundation の components(separatedBy:) を標準ライブラリの split に変換
  convertedCode = convertedCode.replace(
    /(\w+)\.components\(separatedBy:\s*"([^"]+)"\)/g,
    '$1.split(separator: "$2").map(String.init)'
  );
  
  // Foundation import文を削除（SwiftWasmでは不要）
  convertedCode = convertedCode.replace(/^import Foundation\s*$/gm, '');
  
  // その他の互換性改善
  // NSString関連の処理があれば変換
  convertedCode = convertedCode.replace(/NSString/g, 'String');
  
  return convertedCode;
}

export async function POST(request: NextRequest) {
  try {
    const { code }: CompileRequest = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, output: '', error: 'Swift code is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // SwiftWasm対応版に自動変換
    const swiftWasmCode = convertToSwiftWasmCompatible(code);

    // 一時ディレクトリを作成
    const tempDir = tmpdir();
    const packageDir = join(tempDir, `temp_package_${randomUUID()}`);
    const sourcesDir = join(packageDir, 'Sources');
    const swiftFile = join(sourcesDir, 'main.swift');
    const packageSwiftFile = join(packageDir, 'Package.swift');

    try {
      // ディレクトリを作成
      mkdirSync(packageDir, { recursive: true });
      mkdirSync(sourcesDir, { recursive: true });

      // Package.swiftを作成
      const packageContent = `// swift-tools-version: 6.1
import PackageDescription

let package = Package(
    name: "TempPackage",
    platforms: [.macOS(.v12)],
    products: [
        .executable(name: "main", targets: ["main"])
    ],
    targets: [
        .executableTarget(name: "main")
    ]
)`;

      writeFileSync(packageSwiftFile, packageContent);
      
      // SwiftWasm対応版のコードをファイルに書き込み
      writeFileSync(swiftFile, swiftWasmCode);

      // SwiftWasm SDKでコンパイル
      let output = '';
      let errorOutput = '';
      let success = false;
      let wasmBase64: string | undefined;

      try {
        // まずインストールされているSDKを確認
        let availableSDKs = '';
        try {
          availableSDKs = execSync('swift sdk list', {
            encoding: 'utf8',
            env: {
              ...process.env,
              PATH: '/opt/swift/usr/bin:' + (process.env.PATH ? ':' + process.env.PATH : ''),
            }
          });
        } catch (e) {
          console.log('SDK list check failed:', e);
        }

        // 利用可能なWasm SDKを特定
        const wasmSDKName = availableSDKs.split('\n')
          .find(line => line.includes('wasm') || line.includes('WASI'))
          ?.trim() || 'swift-wasm-6.1-RELEASE-wasm32-unknown-wasi';

        console.log('Available SDKs:', availableSDKs);
        console.log('Using WASM SDK:', wasmSDKName);

        const result = execSync(
          `swift build --swift-sdk "${wasmSDKName}" --package-path "${packageDir}" --scratch-path "${join(packageDir, '.build')}"`,
          {
            cwd: packageDir,
            encoding: 'utf8',
            timeout: 30000, // 30秒のタイムアウト
            env: {
              ...process.env,
              PATH: '/opt/swift/usr/bin:' + (process.env.PATH ? ':' + process.env.PATH : ''),
            }
          }
        );
        
        output = result.toString();
        
        // WASMファイルを探す
        const wasmFile = join(packageDir, '.build/wasm32-unknown-wasi/debug/main.wasm');
        
        if (existsSync(wasmFile)) {
          const wasmData = readFileSync(wasmFile);
          wasmBase64 = wasmData.toString('base64');
          success = true;
        }
        
      } catch (error: unknown) {
        errorOutput = error instanceof Error ? error.message : 'Compilation failed';
        
        // エラーの詳細情報を含める
        let debugInfo = `コンパイルエラーの詳細:
- エラーメッセージ: ${errorOutput}
- パッケージディレクトリ: ${packageDir}
- Swiftファイル: ${swiftFile}`;

        const execError = error as { stdout?: string; stderr?: string };
        if (execError.stdout) {
          debugInfo += `\n- stdout: ${execError.stdout}`;
        }
        if (execError.stderr) {
          debugInfo += `\n- stderr: ${execError.stderr}`;
        }

        output = debugInfo;
      }

      const response: CompileResponse = {
        success,
        output: success ? 'コンパイルが成功しました' : output,
        error: success ? undefined : (errorOutput || 'コンパイルエラーが発生しました'),
        wasmBase64
      };

      return NextResponse.json(response, { headers: corsHeaders });

    } finally {
      // 一時ファイルをクリーンアップ
      try {
        if (existsSync(packageDir)) {
          rmSync(packageDir, { recursive: true, force: true });
        }
      } catch (cleanupError) {
        console.warn('一時ファイルのクリーンアップに失敗しました:', cleanupError);
      }
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        output: '',
        error: `リクエストの処理に失敗しました: ${errorMessage}`,
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 