import type { Collection, CollectionItemInput } from 'framer-api';
import { prisma } from '@/lib/prisma';

// Hasil sinkronisasi lowongan -> CMS Framer "Open Jobs" -> publish site.
export interface FramerSyncResult {
  ok: boolean;
  created: number;
  updated: number;
  removed: number;
  published: boolean;
  durationMs: number;
  error?: string;
}

const COLLECTION_NAME = 'Open Jobs';

// Field CMS dipetakan berdasarkan NAMA (bukan ID) supaya tetap valid
// walau field dibuat ulang di editor Framer. HRIS adalah master — Framer
// hanya menampilkan Title, Employment, Apply URL, dan Description.
const FIELD_MAP = {
  title: 'Title',
  employment: 'Employment',
  applyUrl: 'Apply URL',
  description: 'Description',
} as const;

// Field opsional dibuat otomatis lewat API kalau belum ada di collection
// (field lama Title dkk wajib sudah dibuat manual di editor Framer).
const OPTIONAL_FIELDS = [
  { name: FIELD_MAP.applyUrl, type: 'link' as const },
  { name: FIELD_MAP.description, type: 'string' as const },
];

// Field legacy yang sudah tidak dipakai HRIS — kalau masih ada di collection
// (entah sisa lama atau dibuat ulang manual), dihapus otomatis tiap sync
// supaya skema Framer selalu mengikuti HRIS.
const LEGACY_FIELDS = ['Summary', 'Location', 'Department'];

// Guard anti duplikat: beberapa request bisa memicu sync bersamaan dalam
// satu process (instance Vercel yang sama). Sync kedua menumpuk ke promise
// pertama karena hasilnya idempoten.
let inflight: Promise<FramerSyncResult> | null = null;

export function syncLowonganToFramer(): Promise<FramerSyncResult> {
  if (!inflight) {
    inflight = doSync().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

/** Race sebuah promise dengan timeout — promise asli tetap jalan di background. */
export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function envConfig() {
  const apiKey = process.env.job_listing_API_Key?.trim();
  const projectUrl = process.env.job_listing_project_url?.split(/[?#]/)[0].trim();
  if (!apiKey || !projectUrl) {
    return { error: 'job_listing_API_Key / job_listing_project_url belum di-set di .env' };
  }
  return { apiKey, projectUrl };
}

// Nilai fallback untuk baris lama yang field barunya masih null —
// string field di CMS wajib terisi.
function employmentValue(tipeKerja?: string | null, modeKerja?: string | null) {
  const tipe = tipeKerja?.trim() || 'Full-time';
  const mode = modeKerja?.trim() || 'On-site';
  return `${tipe} · ${mode}`;
}

async function doSync(): Promise<FramerSyncResult> {
  const started = Date.now();
  const base = { created: 0, updated: 0, removed: 0, published: false, durationMs: 0 };

  const config = envConfig();
  if ('error' in config) {
    return { ...base, ok: false, error: config.error, durationMs: Date.now() - started };
  }

  // framer-api adalah ESM dengan top-level await — wajib dynamic import(),
  // karena require() (CJS) akan melempar ERR_REQUIRE_ASYNC_MODULE.
  const { connect: connectFn } = await import('framer-api');

  let framer: Awaited<ReturnType<typeof connectFn>> | null = null;
  try {
    const openJobs = await prisma.lowonganKarir.findMany({
      where: { idStatus: 'OPEN' },
      orderBy: { createdAt: 'asc' },
    });

    framer = await connectFn(config.projectUrl, config.apiKey);

    const collections = await framer.getCollections();
    const collection: Collection | undefined = collections.find((c) => c.name === COLLECTION_NAME);
    if (!collection) {
      throw new Error(`Collection "${COLLECTION_NAME}" tidak ditemukan di project Framer`);
    }

    let fields = await collection.getFields();

    // Buat field opsional (Apply URL, Description) kalau belum ada — idempoten.
    for (const def of OPTIONAL_FIELDS) {
      const exists = fields.some((f) => f.name.toLowerCase() === def.name.toLowerCase());
      if (!exists) {
        await collection.addFields([{ type: def.type, name: def.name }]);
        fields = await collection.getFields();
      }
    }

    // Hapus field legacy Summary/Location/Department kalau masih ada.
    const legacyIds = fields
      .filter((f) => LEGACY_FIELDS.some((n) => n.toLowerCase() === f.name.toLowerCase()))
      .map((f) => f.id);
    if (legacyIds.length > 0) {
      await collection.removeFields(legacyIds);
      fields = await collection.getFields();
    }

    const fieldId = (name: string) => {
      const f = fields.find((x) => x.name.toLowerCase() === name.toLowerCase());
      if (!f) throw new Error(`Field "${name}" tidak ada di collection "${COLLECTION_NAME}"`);
      return f.id;
    };
    const ids = {
      title: fieldId(FIELD_MAP.title),
      employment: fieldId(FIELD_MAP.employment),
      applyUrl: fieldId(FIELD_MAP.applyUrl),
      description: fieldId(FIELD_MAP.description),
    };

    const existing = await collection.getItems();
    const existingBySlug = new Map(existing.map((it) => [it.slug, it]));

    const desiredSlugs = new Set(openJobs.map((l) => l.idLowongan.toLowerCase()));

    const inputs: CollectionItemInput[] = openJobs.map((l) => {
      const slug = l.idLowongan.toLowerCase();
      const matched = existingBySlug.get(slug);
      const fieldData = {
        [ids.title]: { type: 'string' as const, value: l.namaPosisi?.trim() || 'Untitled Position' },
        [ids.employment]: { type: 'string' as const, value: employmentValue(l.tipeKerja, l.modeKerja) },
        // Apply URL null saat Google Form Link kosong → baris OPEN di
        // website tetap tampil tapi tidak bisa dipencet.
        [ids.applyUrl]: { type: 'link' as const, value: l.googleFormURL?.trim() || null },
        [ids.description]: {
          type: 'string' as const,
          value: l.deskripsi?.trim() || l.namaPosisi?.trim() || '',
        },
      };
      return matched ? { id: matched.id, slug, fieldData } : { slug, fieldData };
    });

    // Item lama yang tidak ada padanan OPEN-nya (sample Framer + listing
    // yang di-takedown/dihapus) dihapus dari collection.
    const toRemove = existing.filter((it) => !desiredSlugs.has(it.slug)).map((it) => it.id);

    let created = 0;
    let updated = 0;
    if (inputs.length > 0) {
      await collection.addItems(inputs);
      created = inputs.filter((i) => !('id' in i && i.id)).length;
      updated = inputs.length - created;
    }
    if (toRemove.length > 0) {
      await collection.removeItems(toRemove);
    }

    await framer.publish();

    const durationMs = Date.now() - started;
    console.log(
      `[framer-sync] ok created=${created} updated=${updated} removed=${toRemove.length} in ${durationMs}ms`
    );
    return { ok: true, created, updated, removed: toRemove.length, published: true, durationMs };
  } catch (e) {
    const durationMs = Date.now() - started;
    const error = e instanceof Error ? e.message : String(e);
    console.error(`[framer-sync] failed after ${durationMs}ms:`, error);
    return { ...base, ok: false, error, durationMs };
  } finally {
    if (framer) {
      await framer.disconnect().catch(() => undefined);
    }
  }
}
