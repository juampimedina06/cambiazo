import * as fs from 'node:fs';
import * as path from 'node:path';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

// Works identically from src/common/persistence (dev/vitest) and dist/common/persistence (built)
export const API_PACKAGE_ROOT = path.resolve(__dirname, '..', '..', '..');
export const API_DATA_DIR = path.join(API_PACKAGE_ROOT, '.data');

function reviveDates<T>(_key: string, value: unknown): T {
  if (typeof value === 'string' && ISO_DATE_PATTERN.test(value)) {
    return new Date(value) as unknown as T;
  }
  return value as T;
}

export function isPersistenceDisabled(): boolean {
  return process.env.NODE_ENV === 'test';
}

export function readJsonDataFile<T>(filename: string): T | null {
  if (isPersistenceDisabled()) {
    return null;
  }
  const filePath = path.join(API_DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw, (_k, v) => reviveDates(_k, v)) as T;
  } catch {
    return null;
  }
}

export function writeJsonDataFile<T>(filename: string, data: T): void {
  if (isPersistenceDisabled()) {
    return;
  }
  const filePath = path.join(API_DATA_DIR, filename);
  try {
    if (!fs.existsSync(API_DATA_DIR)) {
      fs.mkdirSync(API_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Ignore disk write errors in restricted environments
  }
}
