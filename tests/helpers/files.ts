import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

export const ROOT = process.cwd();

const TEXT_EXT = new Set([
  '.html', '.xml', '.txt', '.js', '.mjs', '.css', '.json', '.svg', '.webmanifest', '.astro', '.ts', '.md', '.mdx',
]);

export function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

export function textFiles(dir: string): string[] {
  return walk(dir).filter((file) => TEXT_EXT.has(extname(file)));
}

export function read(file: string): string {
  return readFileSync(file, 'utf8');
}
