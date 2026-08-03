import { loadSession } from './session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };
  if (auth) {
    const session = loadSession();
    if (session) headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message = (body && body.message) || `Erro ${response.status} ao chamar ${path}`;
    throw new ApiError(Array.isArray(message) ? message.join('; ') : message, response.status);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown, auth = true) => request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }, auth),
  put: <T>(path: string, data: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(path: string, data?: unknown) => request<T>(path, { method: 'PATCH', body: data !== undefined ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
