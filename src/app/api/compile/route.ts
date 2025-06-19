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

export async function POST(request: NextRequest) {
  try {
    const { code }: CompileRequest = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, output: '', error: 'Swift code is required' },
        { status: 400, headers: corsHeaders }
      );
    }

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
      
      // Swiftコードをファイルに書き込み
      writeFileSync(swiftFile, code);

      // SwiftWasm SDKでコンパイル
      let output = '';
      let errorOutput = '';
      let success = false;
      let wasmBase64: string | undefined;

      try {
        const result = execSync(
          `swift build --swift-sdk wasm32-unknown-wasi --package-path "${packageDir}" --scratch-path "${join(packageDir, '.build')}"`,
          {
            cwd: packageDir,
            encoding: 'utf8',
            timeout: 30000, // 30秒のタイムアウト
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