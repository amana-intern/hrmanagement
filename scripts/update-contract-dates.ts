import { prisma } from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

function parseTsvDate(dateStr: string): Date {
  const months: Record<string, number> = {
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
  };
  const parts = dateStr.trim().split(' ');
  const day = parseInt(parts[0], 10);
  const month = months[parts[1]];
  const year = parseInt(parts[2], 10);
  return new Date(Date.UTC(year, month, day));
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function main() {
  const tsvPath = path.resolve(__dirname, '../guide/Database for project amana - Copy Borang Data Diri.tsv');
  const lines = fs.readFileSync(tsvPath, 'utf-8').split('\n');
  const dataLines = lines.slice(2);

  type TsvRow = { nama: string; kontrakMulai: string; kontrakAkhir: string };
  const tsvData: TsvRow[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const cols = line.split('\t');
    if (cols.length < 18) continue;
    const nama = cols[0].trim();
    const kontrakMulai = cols[16].trim();
    const kontrakAkhir = cols[17].trim();
    if (!nama || !kontrakMulai || !kontrakAkhir) continue;
    tsvData.push({ nama, kontrakMulai, kontrakAkhir });
  }

  console.log(`TSV rows parsed: ${tsvData.length}`);

  const karyawanList = await prisma.karyawan.findMany({
    where: { idKaryawan: { gte: 'KRY011', lte: 'KRY094' } },
    select: { idKaryawan: true, nama: true },
    orderBy: { idKaryawan: 'asc' },
  });

  console.log(`Karyawan in DB: ${karyawanList.length}`);

  const nameToKaryawan = new Map<string, typeof karyawanList[0]>();
  for (const k of karyawanList) {
    if (k.nama) nameToKaryawan.set(norm(k.nama), k);
  }

  type MatchResult = {
    idKaryawan: string;
    nama: string;
    dateMulai: Date;
    dateAkhir: Date;
  };
  const matches: MatchResult[] = [];
  const unmatched: string[] = [];

  for (const row of tsvData) {
    const k = nameToKaryawan.get(norm(row.nama));
    if (!k) {
      unmatched.push(row.nama);
      continue;
    }
    matches.push({
      idKaryawan: k.idKaryawan,
      nama: k.nama || row.nama,
      dateMulai: parseTsvDate(row.kontrakMulai),
      dateAkhir: parseTsvDate(row.kontrakAkhir),
    });
  }

  if (unmatched.length > 0) {
    console.log(`\nUNMATCHED (${unmatched.length}):`);
    unmatched.forEach(n => console.log(`  - ${n}`));
    process.exit(1);
  }

  console.log(`Matched: ${matches.length}`);

  let updatedKaryawan = 0;
  let updatedKontrak = 0;
  let createdKontrak = 0;
  let skippedKontrak = 0;

  for (const m of matches) {
    await prisma.karyawan.update({
      where: { idKaryawan: m.idKaryawan },
      data: { tanggalMasuk: m.dateMulai },
    });
    updatedKaryawan++;

    const existingKontrak = await prisma.kontrakKaryawan.findFirst({
      where: { idKaryawan: m.idKaryawan },
      orderBy: { tanggalMulai: 'desc' },
    });

    if (existingKontrak) {
      const mulaiOk = existingKontrak.tanggalMulai?.getTime() === m.dateMulai.getTime();
      const akhirOk = existingKontrak.tanggalBerakhir?.getTime() === m.dateAkhir.getTime();

      if (mulaiOk && akhirOk) {
        skippedKontrak++;
        continue;
      }

      await prisma.kontrakKaryawan.update({
        where: { idKontrak: existingKontrak.idKontrak },
        data: {
          tanggalMulai: m.dateMulai,
          tanggalBerakhir: m.dateAkhir,
        },
      });
      updatedKontrak++;
    } else {
      const num = m.idKaryawan.replace('KRY', '');
      const kontrakId = `KTR${num}`;

      const idExists = await prisma.kontrakKaryawan.findUnique({
        where: { idKontrak: kontrakId },
        select: { idKontrak: true },
      });

      if (idExists) {
        await prisma.kontrakKaryawan.update({
          where: { idKontrak: kontrakId },
          data: {
            idKaryawan: m.idKaryawan,
            tanggalMulai: m.dateMulai,
            tanggalBerakhir: m.dateAkhir,
            idStatus: 'ST_KON_ACTIVE',
          },
        });
      } else {
        await prisma.kontrakKaryawan.create({
          data: {
            idKontrak: kontrakId,
            idKaryawan: m.idKaryawan,
            tanggalMulai: m.dateMulai,
            tanggalBerakhir: m.dateAkhir,
            idStatus: 'ST_KON_ACTIVE',
            carryOver: 0,
            annualQuota: 12,
          },
        });
      }
      createdKontrak++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Karyawan tanggalMasuk updated: ${updatedKaryawan}`);
  console.log(`Kontrak updated (dates changed): ${updatedKontrak}`);
  console.log(`Kontrak created (new): ${createdKontrak}`);
  console.log(`Kontrak already correct (skipped): ${skippedKontrak}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
