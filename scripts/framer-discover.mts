import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { connect } from 'framer-api';

// Load .env manual (script dijalankan via tsx, tidak otomatis baca .env)
function loadEnv() {
  try {
    const raw = readFileSync(join(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, key, value] = m;
      if (!(key in process.env)) process.env[key] = value.replace(/\s+$/, '');
    }
  } catch {
    // .env tidak ada — fallback ke env sistem
  }
}

function fail(msg: string): never {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

loadEnv();

const apiKey = process.env.job_listing_API_Key;
const projectUrl = process.env.job_listing_project_url;
if (!apiKey) fail('job_listing_API_Key tidak ada di .env');
if (!projectUrl) fail('job_listing_project_url tidak ada di .env');

// Buang query/hash (mis. ?node=xxx) — connect() hanya butuh URL project murni
const cleanUrl = projectUrl.split(/[?#]/)[0].trim();

async function main() {
  console.log(`Connecting to: ${cleanUrl}`);
  const framer = await connect(cleanUrl, apiKey);
  try {
    const info = await framer.getProjectInfo();
    console.log(`Project: ${info.name}\n`);

    const collections = await framer.getCollections();
    console.log(`Collections (${collections.length}):`);
    for (const c of collections) console.log(`  - "${c.name}" (id: ${c.id})`);
    console.log();

    for (const c of collections) {
      console.log(`=== Collection "${c.name}" (${c.id}) ===`);
      const fields = await c.getFields();
      console.log('Fields:');
      for (const f of fields) {
        const type = f.type as string;
        let extra = '';
        if (type === 'enum' && 'cases' in f && Array.isArray(f.cases)) {
          extra = ` cases=[${f.cases.map((x: { name: string }) => x.name).join(', ')}]`;
        }
        console.log(`  - ${f.name} (id: ${f.id}, type: ${type})${extra}`);
      }

      const items = await c.getItems();
      console.log(`Items (${items.length}):`);
      for (const it of items) {
        console.log(`  - id=${it.id} slug="${it.slug}" draft=${(it as { draft?: boolean }).draft ?? false}`);
        const data = (it as { fieldData?: Record<string, { type?: string; value?: unknown }> }).fieldData;
        if (data) {
          for (const [fieldId, entry] of Object.entries(data)) {
            const field = fields.find((x) => x.id === fieldId);
            const label = field ? field.name : fieldId;
            const value = typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value);
            console.log(`      ${label} [${entry.type}] = ${String(value).slice(0, 120)}`);
          }
        }
      }
      console.log();
    }
  } finally {
    await framer.disconnect();
  }
}

main().catch((e) => {
  console.error('Discovery gagal:', e);
  process.exit(1);
});
