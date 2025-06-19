import { NextResponse } from 'next/server';

interface HealthResponse {
  status: string;
  service: string;
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
  const response: HealthResponse = {
    status: 'ok',
    service: 'SwiftWasm Compiler Server'
  };

  return NextResponse.json(response, { headers: corsHeaders });
} 