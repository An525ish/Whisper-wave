import { BASE_URL } from '@/constants/app';

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

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers, params } = options;

  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(buildUrl(endpoint, params), {
    method,
    credentials: 'include',
    headers: isFormData
      ? headers
      : {
          'Content-Type': 'application/json',
          ...headers,
        },
    body,
  });

  let payload: unknown = null;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof (payload as { message: unknown }).message === 'string'
        ? (payload as { message: string }).message
        : 'Request failed';
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export const api = {
  get: <T>(endpoint: string, params?: RequestOptions['params']) =>
    request<T>(endpoint, { method: 'GET', params }),

  post: <T>(
    endpoint: string,
    body?: unknown,
    headers?: HeadersInit,
  ) =>
    request<T>(endpoint, {
      method: 'POST',
      body:
        body instanceof FormData || typeof body === 'string' || body == null
          ? (body as BodyInit | null)
          : JSON.stringify(body),
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
