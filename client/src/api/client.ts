import { BASE_URL } from '@/constants/app';
import { useAuthStore } from '@/stores/auth';

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

type RequestOptions = {
  method?: string;
  body?: BodyInit | null;
  headers?: HeadersInit;
  params?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(
  endpoint: string,
  params?: RequestOptions['params'],
): string {
  const url = new URL(
    endpoint.startsWith('http')
      ? endpoint
      : `${BASE_URL}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
  );

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function parseBody(body: unknown): BodyInit | null | undefined {
  if (body instanceof FormData || typeof body === 'string' || body == null) {
    return body as BodyInit | null;
  }
  return JSON.stringify(body);
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return response.json();
  return null;
}

function extractMessage(payload: unknown): string {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof (payload as { message: unknown }).message === 'string'
  ) {
    return (payload as { message: string }).message;
  }
  return 'Request failed';
}

/** Attempt a silent token refresh. Returns true if successful. */
async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const { method = 'GET', body, headers, params } = options;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(buildUrl(endpoint, params), {
    method,
    credentials: 'include',
    headers: isFormData
      ? headers
      : { 'Content-Type': 'application/json', ...headers },
    body,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    // On first 401, silently try to refresh the access token then retry once.
    if (response.status === 401 && !isRetry) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return request<T>(endpoint, options, true);
      }
      // Refresh failed — session is dead. Clear auth state so the app redirects to /auth.
      useAuthStore.getState().clear();
    }

    throw new ApiError(extractMessage(payload), response.status, payload);
  }

  return payload as T;
}

export const api = {
  get: <T>(endpoint: string, params?: RequestOptions['params']) =>
    request<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown, headers?: HeadersInit) =>
    request<T>(endpoint, {
      method: 'POST',
      body: parseBody(body),
      headers,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),

  delete: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'DELETE',
      body: body == null ? undefined : JSON.stringify(body),
    }),
};
