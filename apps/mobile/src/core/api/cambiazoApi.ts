import { type ConsentStatus, type UserRole } from '@cambiazo/shared';

export const BACKEND_UNAVAILABLE_MESSAGE =
  'No se pudo conectar con el servidor. Verificá que el backend esté activo.';

const DEFAULT_BASE_URL = 'http://localhost:3010/api/v1';
const DEFAULT_TIMEOUT_MS = 5000;

export interface ApiAuthContext {
  role?: UserRole | null;
  userId?: string;
  institutionId?: string;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  auth?: ApiAuthContext;
  skipAuth?: boolean;
  timeoutMs?: number;
}

interface BackendErrorPayload {
  message?: string | string[];
  code?: string;
  error?: string | { code?: string; message?: string };
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly payload: unknown;

  constructor(
    message: string,
    status: number,
    code = 'API_ERROR',
    payload?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

let resolvedBaseUrl: string | null = null;
let authContextProvider: (() => ApiAuthContext) | null = null;

export function registerApiAuthProvider(provider: () => ApiAuthContext): void {
  authContextProvider = provider;
}

export function resetApiBaseUrlCache(): void {
  resolvedBaseUrl = null;
}

export function normalizeConsentStatus(rawStatus?: string | null): ConsentStatus {
  const upper = (rawStatus || '').toUpperCase();
  if (upper === 'GRANTED' || upper === 'REVOKED' || upper === 'PENDING') {
    return upper;
  }
  return 'PENDING';
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) {
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function parseBackendError(
  payload: unknown,
  status: number,
  fallback: string
): ApiClientError {
  const typed = (payload && typeof payload === 'object' ? payload : null) as BackendErrorPayload | null;
  const nestedError =
    typed?.error && typeof typed.error === 'object' ? typed.error : null;

  let message = fallback;
  if (Array.isArray(typed?.message) && typed.message.length > 0) {
    message = typed.message.join(', ');
  } else if (typeof typed?.message === 'string' && typed.message.trim().length > 0) {
    message = typed.message;
  } else if (typeof nestedError?.message === 'string' && nestedError.message.trim().length > 0) {
    message = nestedError.message;
  }

  const code =
    typed?.code ||
    nestedError?.code ||
    (typeof typed?.error === 'string' ? typed.error : `HTTP_${status}`);

  return new ApiClientError(message, status, code, payload);
}

function extractExpoLanHost(): string | null {
  try {
    // Dynamically read React Native's bundle URL so physical devices on LAN discover the host IP.
    const rn = require('react-native') as {
      TurboModuleRegistry?: { get?: (name: string) => { getConstants?: () => { scriptURL?: string } } | null };
      NativeModules?: { SourceCode?: { getConstants?: () => { scriptURL?: string }; scriptURL?: string } };
    };
    const scriptURL =
      rn?.TurboModuleRegistry?.get?.('SourceCode')?.getConstants?.()?.scriptURL ||
      rn?.NativeModules?.SourceCode?.getConstants?.()?.scriptURL ||
      rn?.NativeModules?.SourceCode?.scriptURL;

    if (!scriptURL) return null;
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
    const host = match?.[1];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3010/api/v1`;
    }
  } catch {
    // Safe fallback outside React Native runtime (e.g. Vitest / SSR).
  }
  return null;
}

function getCandidateBaseUrls(): string[] {
  const candidates: string[] = [];
  const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

  if (resolvedBaseUrl && !isTestEnv) {
    candidates.push(resolvedBaseUrl);
  }

  const lanUrl = extractExpoLanHost();
  if (lanUrl && !candidates.includes(lanUrl)) {
    candidates.push(lanUrl);
  }

  const envUrl =
    (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL : undefined) ||
    DEFAULT_BASE_URL;
  if (!candidates.includes(envUrl)) {
    candidates.push(envUrl);
  }

  const fallbacks = [
    DEFAULT_BASE_URL,
    'http://127.0.0.1:3010/api/v1',
    'http://10.0.2.2:3010/api/v1',
  ];
  for (const url of fallbacks) {
    if (!candidates.includes(url)) {
      candidates.push(url);
    }
  }

  return candidates;
}

function buildHeaders(options?: ApiRequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers ?? {}),
  };

  if (options?.skipAuth) {
    return headers;
  }

  const sessionAuth = authContextProvider ? authContextProvider() : {};
  const role = options?.auth?.role ?? sessionAuth.role ?? undefined;
  const userId = options?.auth?.userId ?? sessionAuth.userId ?? undefined;
  const institutionId = options?.auth?.institutionId ?? sessionAuth.institutionId ?? undefined;

  if (role) {
    headers['x-user-role'] = role;
  }
  if (userId) {
    headers['x-user-id'] = userId;
  }
  if (institutionId) {
    headers['x-institution-id'] = institutionId;
  }

  return headers;
}

async function fetchWithDiscovery(
  path: string,
  options?: ApiRequestOptions
): Promise<Response> {
  const candidates = getCandidateBaseUrls();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const headers = buildHeaders(options);
  const init: RequestInit = {
    method: options?.method ?? 'GET',
    headers,
    ...(options?.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  };

  let lastError: unknown;

  for (const baseUrl of candidates) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (timeoutId) clearTimeout(timeoutId);
      resolvedBaseUrl = baseUrl;
      return response;
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      lastError = err;
    }
  }

  throw new ApiClientError(
    BACKEND_UNAVAILABLE_MESSAGE,
    0,
    'NETWORK_ERROR',
    lastError
  );
}

async function request<T>(
  path: string,
  options?: ApiRequestOptions,
  fallbackError = 'Error al comunicarse con el servidor'
): Promise<T> {
  const response = await fetchWithDiscovery(path, options);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw parseBackendError(payload, response.status, fallbackError);
  }

  return payload as T;
}

export const cambiazoApi = {
  request,
  get: <T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>, fallbackError?: string) =>
    request<T>(path, { ...options, method: 'GET' }, fallbackError),
  post: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>, fallbackError?: string) =>
    request<T>(path, { ...options, method: 'POST', body }, fallbackError),
  put: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>, fallbackError?: string) =>
    request<T>(path, { ...options, method: 'PUT', body }, fallbackError),
  patch: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>, fallbackError?: string) =>
    request<T>(path, { ...options, method: 'PATCH', body }, fallbackError),
  delete: <T>(path: string, options?: Omit<ApiRequestOptions, 'method'>, fallbackError?: string) =>
    request<T>(path, { ...options, method: 'DELETE' }, fallbackError),
};

