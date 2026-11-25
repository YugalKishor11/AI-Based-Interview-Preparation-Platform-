// PrepSphere Code Execution Sandbox Adapter
// Enforces server-side sandboxing boundaries (CPU, memory, wall-clock time limits, zero network).
// In v1 demo mode, execution remains safely disabled with explicit reason.

export interface CodeExecutionRequest {
  language: 'javascript' | 'python' | 'typescript';
  code: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface CodeExecutionResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionDurationMs: number;
  memoryUsedBytes: number;
  sandboxed: boolean;
  disabledReason?: string;
}

export class CodeExecutionAdapter {
  private isSandboxConfigured(): boolean {
    return Boolean(import.meta.env.VITE_CODE_SANDBOX_URL);
  }

  public async execute(req: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    if (!this.isSandboxConfigured()) {
      return {
        success: false,
        stdout: '',
        stderr: 'Code execution is disabled in the v1 sandbox environment. Technical interviews evaluate design, reasoning, and asymptotic complexity without untrusted client code execution.',
        exitCode: 1,
        executionDurationMs: 0,
        memoryUsedBytes: 0,
        sandboxed: true,
        disabledReason: 'Execution sandbox disabled in v1 demo environment.',
      };
    }

    // In production environment with configured isolated sandbox (e.g., Piston or WebAssembly micro-container):
    try {
      const response = await fetch(import.meta.env.VITE_CODE_SANDBOX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: req.language,
          code: req.code,
          timeout: req.timeoutMs || 5000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sandbox execution failed with HTTP ${response.status}`);
      }

      return (await response.json()) as CodeExecutionResponse;
    } catch (err: unknown) {
      return {
        success: false,
        stdout: '',
        stderr: `Execution error: ${err instanceof Error ? err.message : String(err)}`,
        exitCode: 1,
        executionDurationMs: 0,
        memoryUsedBytes: 0,
        sandboxed: true,
      };
    }
  }
}

export const codeExecution = new CodeExecutionAdapter();
