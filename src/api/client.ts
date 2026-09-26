export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  token?: string | null;
  body?: unknown;
};

const PRODUCTION_API = 'https://www.hockeyver.com';

function resolveUrl(path: string) {
  const configured = API_BASE_URL.replace(/\/$/, '');
  if (configured.startsWith('https://')) return `${configured}${path}`;
  // En développement, une adresse relative passe par le serveur Expo.
  if (__DEV__) return path;
  return `${PRODUCTION_API}${path}`;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(resolveUrl(path), {
      method: options.method ?? 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError('Impossible de joindre le serveur.', 0);
  }
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new ApiError(payload.error || 'Une erreur est survenue.', response.status);
  }
  return payload as T;
}
