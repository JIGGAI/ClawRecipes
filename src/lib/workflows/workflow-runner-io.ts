import fs from 'node:fs/promises';

export async function readTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf8');
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await readTextFile(filePath)) as T;
}

export async function maybeReadTextFile(filePath: string): Promise<string | null> {
  try {
    return await readTextFile(filePath);
  } catch {
    return null;
  }
}
