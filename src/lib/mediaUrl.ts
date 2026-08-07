import { API_BASE_URL } from './api';

/** Origem da API sem sufixo /api (para arquivos em /uploads). */
export function apiOrigin(): string {
  return API_BASE_URL.replace(/\/api\/?$/, '');
}

/** Monta URL absoluta para reproduzir o video no player. */
export function resolveMediaUrl(pathOrUrl: string): string {
  const value = pathOrUrl.trim();
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${apiOrigin()}${value}`;
  return `${apiOrigin()}/${value}`;
}
