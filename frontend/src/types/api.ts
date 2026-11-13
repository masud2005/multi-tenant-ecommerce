// Centralized API response and error contract types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

/** Keeps a success/message envelope when the payload itself is absent. */
export function unchangedEnvelope<T>(
  res: { success?: boolean; message?: string; errors?: Record<string, string[]> } | null | undefined,
): ApiResponse<T> {
  return {
    success: Boolean(res?.success),
    message: res?.message,
    errors: res?.errors,
    data: undefined as T,
  };
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  meta: PaginatedMeta;
  message?: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  errors?: Record<string, string[]>;
  timestamp?: string;
  path?: string;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}
