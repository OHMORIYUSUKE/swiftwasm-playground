import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// CORS設定
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wasmId } = await params;
    
    if (!wasmId) {
      return new NextResponse('WASM ID is required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // 一時ディレクトリのWASMファイルパスを構築
    const tempDir = tmpdir();
    const wasmFile = join(tempDir, `wasm_${wasmId}.wasm`);

    if (!existsSync(wasmFile)) {
      return new NextResponse('WASM file not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // WASMファイルを読み込み
    const wasmData = readFileSync(wasmFile);

    // レスポンスヘッダーを設定
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/wasm',
      'Content-Length': wasmData.length.toString(),
      'Cache-Control': 'no-cache', // 一時ファイルなのでキャッシュしない
    };

    return new NextResponse(wasmData, {
      status: 200,
      headers: responseHeaders
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`WASM file read error: ${errorMessage}`, {
      status: 500,
      headers: corsHeaders
    });
  }
} 