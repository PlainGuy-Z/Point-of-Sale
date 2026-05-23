export function normalizeApiBaseUrl(rawBase: string): string {
  return rawBase.trim().replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  const base =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL;

  if (base) return normalizeApiBaseUrl(base);

  return 'http://localhost:4000';
}