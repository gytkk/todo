export function serializeDate(date: Date | string | undefined | null): string {
  if (!date) return '';
  return date instanceof Date ? date.toISOString() : date;
}

export function deserializeDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr || dateStr === '') return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

export function serializeBoolean(value: boolean | undefined | null): string {
  return value ? 'true' : 'false';
}

export function deserializeBoolean(value: string | undefined | null): boolean {
  return value === 'true';
}

export function serializeNumber(value: number | undefined | null): string {
  return value !== undefined && value !== null ? value.toString() : '0';
}

export function deserializeNumber(value: string | undefined | null): number {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

export function serializeArray<T>(array: T[] | undefined | null): string {
  return array ? JSON.stringify(array) : '[]';
}

export function deserializeArray<T>(value: string | undefined | null): T[] {
  if (!value || value === '') return [];
  try {
    return JSON.parse(value) as T[];
  } catch {
    return [];
  }
}

export function serializeObject<T extends Record<string, unknown>>(obj: T | undefined | null): string {
  return obj ? JSON.stringify(obj) : '{}';
}

export function deserializeObject<T extends Record<string, unknown>>(value: string | undefined | null): T | null {
  if (!value || value === '') return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}