import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Load .env manual — tsx tidak otomatis membaca .env
const raw = readFileSync(join(process.cwd(), '.env'), 'utf8');
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  if (!(m[1] in process.env)) process.env[m[1]] = m[2].replace(/\s+$/, '');
}

const { syncLowonganToFramer } = await import('../lib/framer-sync');

const result = await syncLowonganToFramer();
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
