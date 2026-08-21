-- AlterTable
ALTER TABLE "IzinSakit" ADD COLUMN "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Backfill data lama pakai tanggal mulai (agar kolom Submitted tidak kosong)
UPDATE "IzinSakit" SET "createdAt" = COALESCE("tanggalMulai", CURRENT_TIMESTAMP) WHERE "createdAt" IS NULL;