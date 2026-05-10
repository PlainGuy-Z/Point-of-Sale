export function normalizeApiBaseUrl(rawBase: string): string {
  const trimmed = rawBase.trim();
  if (!trimmed) {
    throw new Error('VITE_API_BASE_URL is empty. Set it in Front-End/.env or Vercel env vars.');
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$|\s+$/g, '');
  if (/^https?:\/\//i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash.replace(/\/+$/, '');
  }

  return `https://${withoutTrailingSlash}`.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (base) {
    return normalizeApiBaseUrl(base);
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:4000';
  }

  throw new Error('VITE_API_BASE_URL is not set. Add it to Front-End/.env or Vercel environment variables.');
}
