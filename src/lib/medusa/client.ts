import { medusaConfig } from './config';

export class MedusaApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'MedusaApiError';
    this.status = status;
  }
}

type MedusaFetchOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined | null>;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

function buildMedusaUrl(path: string, query?: MedusaFetchOptions['query']) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(normalizedPath, medusaConfig.backendUrl);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export async function medusaFetch<T>(
  path: string,
  options: MedusaFetchOptions = {}
): Promise<T> {
  const { query, headers, ...fetchOptions } = options;
  const requestHeaders = new Headers(headers);

  requestHeaders.set('Content-Type', 'application/json');

  if (medusaConfig.publishableKey) {
    requestHeaders.set('x-publishable-api-key', medusaConfig.publishableKey);
  }

  // Medusa v2 pricing context via headers
  if (medusaConfig.regionId) {
    requestHeaders.set('x-region-id', medusaConfig.regionId);
  }
  requestHeaders.set('x-currency', 'inr');
  requestHeaders.set('x-currency-code', 'inr');

  const response = await fetch(buildMedusaUrl(path, query), {
    ...fetchOptions,
    headers: requestHeaders,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new MedusaApiError(
      errorBody.message || `Medusa request failed with status ${response.status}`,
      response.status
    );
  }

  return response.json() as Promise<T>;
}
