export interface CompileResponse {
  success: boolean;
  wasmBase64?: string;
  error?: string;
  output?: string;
} 