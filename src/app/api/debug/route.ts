import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

// CORS設定
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

interface DebugInfo {
  timestamp: string;
  checks: {
    swiftVersion?: { status: string; output?: string; error?: string };
    swiftSdks?: { status: string; output?: string; error?: string; hasWasmSdk?: boolean };
    environment?: Record<string, string | undefined>;
    wasmSdkInstalled?: { status: string; output?: string; error?: string };
  };
}

export async function GET() {
  const debugInfo: DebugInfo = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    // Swift本体のバージョン確認
    try {
      const swiftVersion = execSync('swift --version', { 
        encoding: 'utf8', 
        timeout: 5000,
        env: {
          ...process.env,
          PATH: '/opt/swift/usr/bin:' + (process.env.PATH ? ':' + process.env.PATH : ''),
        }
      });
      
      // バージョン情報を整理
      const versionLine = swiftVersion.trim().split('\n')[0];
      const versionMatch = versionLine.match(/Swift version (\d+\.\d+(?:\.\d+)?)/);
      const releaseMatch = versionLine.match(/\((swift-[\d\.]+-RELEASE)\)/);
      
      let cleanVersion = versionLine;
      if (versionMatch && releaseMatch) {
        cleanVersion = `Swift ${versionMatch[1]} (${releaseMatch[1]})`;
      }
      
      debugInfo.checks.swiftVersion = {
        status: 'success',
        output: cleanVersion
      };
    } catch (error) {
      debugInfo.checks.swiftVersion = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // SwiftWasm SDK の確認
    try {
      const sdkList = execSync('swift sdk list', { 
        encoding: 'utf8', 
        timeout: 5000,
        env: {
          ...process.env,
          PATH: '/opt/swift/usr/bin:' + (process.env.PATH ? ':' + process.env.PATH : ''),
        }
      });
      debugInfo.checks.swiftSdks = {
        status: 'success',
        output: sdkList.trim(),
        hasWasmSdk: sdkList.includes('wasm') || sdkList.includes('WASI')
      };
    } catch (error) {
      debugInfo.checks.swiftSdks = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // 環境変数確認
    debugInfo.checks.environment = {
      PATH: process.env.PATH,
      NODE_ENV: process.env.NODE_ENV,
      platform: process.platform,
      arch: process.arch
    };

    // SwiftWasm SDK インストール確認のテスト
    try {
      const testCompile = execSync('swift sdk list | grep -i wasm', { 
        encoding: 'utf8', 
        timeout: 5000,
        env: {
          ...process.env,
          PATH: '/opt/swift/usr/bin:' + (process.env.PATH ? ':' + process.env.PATH : ''),
        }
      });
      debugInfo.checks.wasmSdkInstalled = {
        status: 'success',
        output: testCompile.trim()
      };
    } catch (error) {
      debugInfo.checks.wasmSdkInstalled = {
        status: 'error', 
        error: error instanceof Error ? error.message : 'WASM SDK not found'
      };
    }

    return NextResponse.json(debugInfo, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
} 