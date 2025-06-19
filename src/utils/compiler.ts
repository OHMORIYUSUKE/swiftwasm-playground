import { CompileResponse } from '../types';
import { createWasiImports } from './wasi';

export async function compileSwiftCode(code: string): Promise<CompileResponse> {
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

  return await response.json();
}

export async function executeWasm(
  wasmBytes: Uint8Array,
  setOutput: (updater: (prev: string) => string) => void
): Promise<void> {
  const wasiImportsHelper = createWasiImports(setOutput);
  const { setInstance, ...wasiImports } = wasiImportsHelper;
  
  try {
    const wasmModule = await WebAssembly.compile(wasmBytes);
    const instance = await WebAssembly.instantiate(wasmModule, wasiImports);
    
    // インスタンスをWASIに設定
    setInstance(instance);
    
    // _startを実行
    if (instance.exports._start) {
      (instance.exports._start as (() => void))();
    } else {
      throw new Error('WebAssemblyモジュールに_start関数が見つかりません');
    }
  } catch (error) {
    throw new Error(`WebAssembly実行エラー: ${(error as Error).message}`);
  }
} 