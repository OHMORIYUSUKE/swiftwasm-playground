import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

interface SDKTestResponse {
  status: string;
  exitCode?: number;
  sdks?: string;
  error?: string;
  message?: string;
}

// CORS設定
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    const result = execSync('swift sdk list', {
      encoding: 'utf8',
      timeout: 10000, // 10秒のタイムアウト
    });

    const response: SDKTestResponse = {
      status: 'tested',
      exitCode: 0,
      sdks: result.toString(),
    };

    return NextResponse.json(response, { headers: corsHeaders });

  } catch (error: unknown) {
    let response: SDKTestResponse;
    
    if (error && typeof error === 'object' && 'status' in error) {
      // execSyncのエラー
      const execError = error as { status: number; stdout: Buffer; stderr: Buffer };
      response = {
        status: 'tested',
        exitCode: execError.status,
        sdks: execError.stdout?.toString(),
        error: execError.stderr?.toString() || undefined,
      };
    } else {
      // その他のエラー
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      response = {
        status: 'error',
        message: errorMessage,
      };
    }

    return NextResponse.json(response, { headers: corsHeaders });
  }
} 