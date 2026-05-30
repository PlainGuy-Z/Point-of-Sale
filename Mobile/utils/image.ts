/**
 * Resolves an image path to a full URI if it is a relative backend path.
 */
export function resolveImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('file:')) {
    return url;
  }
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanUrl}`;
}
