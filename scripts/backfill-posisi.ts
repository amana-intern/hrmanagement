import { prisma } from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

// Backfill Karyawan.posisi dari TSV "Nama Posisi" (Borang Data Diri).
// Match prioritas: Email Amana -> user.email (case-insensitive), fallback: Nama Lengkap -> karyawan.nama.
// Idempotent: hanya update bila nilainya berbeda. Jalankan: npx tsx scripts/backfill-posisi.ts

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

type TsvRow = { nama: string; posisi: string; email: string; status: string };

function readTsv(): TsvRow[] {
  const tsvPath = path.resolve(__dirname, '../guide/Database for project amana - Copy Borang Data Diri.tsv');
  const lines = fs.readFileSync(tsvPath, 'utf-8').split('\n');
  const rows: TsvRow[] = [];
  for (const line of lines.slice(2)) {
    if (!line.trim()) continue;
    const cols = line.split('\t');
    if (cols.length < 13) continue;
    const nama = (cols[0] ?? '').replace(/\r$/, '').trim();
    const posisi = (cols[8] ?? '').replace(/\r$/, '').trim();
    const email = (cols[12] ?? '').replace(/\r$/, '').trim();
    const status = (cols[3] ?? '').replace(/\r$/, '').trim();
    if (!nama) continue;
    rows.push({ nama, posisi, email, status });
  }
  return rows;
}

async function main() {
  const tsvRows = readTsv();
  console.log(`TSV rows parsed: ${tsvRows.length}`);

  const karyawanList = await prisma.karyawan.findMany({
    select: { idKaryawan: true, nama: true, posisi: true, user: { select: { email: true } } },
    orderBy: { idKaryawan: 'asc' },
  });
  console.log(`Karyawan in DB: ${karyawanList.length}`);

  const byEmail = new Map<string, TsvRow>();
  const byNama = new Map<string, TsvRow>();
  for (const r of tsvRows) {
    const keyEmail = norm(r.email);
    if (keyEmail && !byEmail.has(keyEmail)) byEmail.set(keyEmail, r);
    const keyNama = norm(r.nama);
    if (keyNama && !byNama.has(keyNama)) byNama.set(keyNama, r);
  }

  const usedTsv = new Set<string>();
  const updates: { idKaryawan: string; nama: string; posisi: string }[] = [];
  const matched: string[] = [];
  const noTsv: string[] = [];
  const noPosisi: string[] = [];

  for (const k of karyawanList) {
    const email = norm(k.user?.email ?? '');
    const nama = norm(k.nama ?? '');
    const row = (email && byEmail.get(email)) || (nama && byNama.get(nama)) || null;
    if (!row) {
      noTsv.push(`${k.idKaryawan} ${k.nama ?? '-'} <${k.user?.email ?? '-'}>`);
      continue;
    }
    usedTsv.add(norm(row.nama));
    if (!row.posisi) {
      noPosisi.push(`${k.idKaryawan} ${k.nama ?? '-'} (TSV tanpa Nama Posisi)`);
      continue;
    }
    matched.push(`${k.idKaryawan} ${k.nama ?? '-'} -> ${row.posisi}`);
    if ((k.posisi ?? '') !== row.posisi) {
      updates.push({ idKaryawan: k.idKaryawan, nama: k.nama ?? '-', posisi: row.posisi });
    }
  }

  const notInDb = tsvRows.filter((r) => !usedTsv.has(norm(r.nama)));

  for (const u of updates) {
    await prisma.karyawan.update({
      where: { idKaryawan: u.idKaryawan },
      data: { posisi: u.posisi },
    });
  }

  console.log(`\nMatched (TSV -> DB): ${matched.length}`);
  console.log(`Updated posisi: ${updates.length} (sudah sama / skip: ${matched.length - updates.length})`);

  if (noTsv.length > 0) {
    console.log(`\nDB tanpa pasangan TSV (${noTsv.length}):`);
    noTsv.forEach((n) => console.log(`  - ${n}`));
  }
  if (noPosisi.length > 0) {
    console.log(`\nTSV tanpa Nama Posisi (${noPosisi.length}):`);
    noPosisi.forEach((n) => console.log(`  - ${n}`));
  }
  if (notInDb.length > 0) {
    console.log(`\nTSV tanpa pasangan DB (${notInDb.length}):`);
    notInDb.forEach((r) => console.log(`  - ${r.nama} <${r.email}> [${r.status}] posisi=${r.posisi || '-'}`));
  }

  console.log('\n=== SPOT CHECK ===');
  const spot = await prisma.karyawan.findMany({
    where: { nama: { in: ['Prasetya Dwicahya', 'Siti Inertia', 'Dwi Ardiansyah', 'Andara Chantika Rahmadina'] } },
    select: { nama: true, posisi: true },
    orderBy: { nama: 'asc' },
  });
  spot.forEach((s) => console.log(`  ${s.nama}: ${s.posisi}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
