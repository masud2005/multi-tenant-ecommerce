import { Prisma } from '../../../prisma/generated/client';

export function toInputJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const next = toInputJson(item);
      return next === undefined ? [] : [next];
    });
  }
  if (value && typeof value === 'object') {
    const out: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, item] of Object.entries(value)) {
      const next = toInputJson(item);
      if (next !== undefined) out[key] = next;
    }
    return out;
  }
  return undefined;
}

export function parseJson(text: string): unknown {
  return JSON.parse(text) as unknown;
}
