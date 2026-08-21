-- CreateTable
CREATE TABLE "KaryawanHistory" (
    "idHistory" VARCHAR NOT NULL,
    "idKaryawan" VARCHAR,
    "tipe" VARCHAR,
    "nilaiLama" VARCHAR,
    "nilaiBaru" VARCHAR,
    "diubahOleh" VARCHAR,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KaryawanHistory_pkey" PRIMARY KEY ("idHistory")
);

-- AddForeignKey
ALTER TABLE "KaryawanHistory" ADD CONSTRAINT "KaryawanHistory_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE SET NULL ON UPDATE CASCADE;