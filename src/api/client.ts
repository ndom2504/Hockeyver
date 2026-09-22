/**
 * Point d'entrée REST prévu pour la phase backend.
 * Les écrans passent par services/, jamais par ce module.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
