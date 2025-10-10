export interface WiseError {
  code: string;
  message: string;
  path?: string;
  arguments?: unknown[];
}

export interface WiseErrorResponse {
  errors?: WiseError[];
}

export function parseWiseError(data: unknown): {
  code?: string;
  message: string;
} {
  const d = data as WiseErrorResponse | undefined;
  const first = d?.errors?.[0];
  return {
    code: first?.code,
    message: first?.message ?? "Request failed",
  };
}
