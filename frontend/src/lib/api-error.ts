export interface ApiFieldError {
  field?: string;
  message?: string;
  value?: string;
}

export interface ApiErrorBody {
  message?: string;
  errors?: ApiFieldError[];
}

export interface ApiErrorShape {
  message?: string;
  body?: ApiErrorBody;
  response?: {
    data?: ApiErrorBody;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readFieldErrors(value: unknown): ApiFieldError[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter(isRecord).map((item) => ({
    field: typeof item.field === 'string' ? item.field : undefined,
    message: typeof item.message === 'string' ? item.message : undefined,
    value: typeof item.value === 'string' ? item.value : undefined,
  }));
}

function readBody(value: unknown): ApiErrorBody | undefined {
  if (!isRecord(value)) return undefined;
  return {
    message: typeof value.message === 'string' ? value.message : undefined,
    errors: readFieldErrors(value.errors),
  };
}

/** Read message, validation errors, and nested response data off an unknown throw. */
export function asApiError(error: unknown): ApiErrorShape {
  if (!isRecord(error)) {
    return { message: typeof error === 'string' ? error : undefined };
  }

  const response = isRecord(error.response) ? error.response : undefined;
  return {
    message: typeof error.message === 'string' ? error.message : undefined,
    body: readBody(error.body),
    response: response ? { data: readBody(response.data) } : undefined,
  };
}
