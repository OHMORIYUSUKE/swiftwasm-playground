export interface CompileResponse {
  success: boolean;
  wasmId?: string;
  error?: string;
  output?: string;
} 