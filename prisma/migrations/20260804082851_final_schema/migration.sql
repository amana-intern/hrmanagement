/*
  Warnings:

  - You are about to drop the column `divisi` on the `Karyawan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "IzinSakit" ADD COLUMN     "gejala" VARCHAR;

-- AlterTable
ALTER TABLE "Karyawan" DROP COLUMN "divisi",
ADD COLUMN     "department" VARCHAR;

-- AlterTable
ALTER TABLE "KontrakKaryawan" ADD COLUMN     "annualQuota" INTEGER DEFAULT 12,
ADD COLUMN     "carryOver" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "PaymentRequest" ADD COLUMN     "detail" TEXT,
ADD COLUMN     "tanggalJadwalPembayaran" TIMESTAMP,
ADD COLUMN     "tanggalLunas" TIMESTAMP;

-- CreateTable
CREATE TABLE "SertifikatKaryawan" (
    "idSertifikat" VARCHAR NOT NULL,
    "idKaryawan" VARCHAR,
    "judul" VARCHAR,
    "fileName" VARCHAR,
    "fileURL" VARCHAR,

    CONSTRAINT "SertifikatKaryawan_pkey" PRIMARY KEY ("idSertifikat")
);

-- CreateTable
CREATE TABLE "PaymentAttachment" (
    "idAttachment" VARCHAR NOT NULL,
    "idRequest" VARCHAR,
    "fileName" VARCHAR,
    "fileURL" VARCHAR,
    "kategori" VARCHAR,

    CONSTRAINT "PaymentAttachment_pkey" PRIMARY KEY ("idAttachment")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "idAssessment" VARCHAR NOT NULL,
    "judul" VARCHAR,
    "deskripsi" VARCHAR,
    "tanggalBuka" TIMESTAMP,
    "tanggalTutup" TIMESTAMP,
    "idStatus" VARCHAR,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("idAssessment")
);

-- CreateTable
CREATE TABLE "AssessmentCategory" (
    "idKategoriAsm" VARCHAR NOT NULL,
    "idAssessment" VARCHAR,
    "namaKategori" VARCHAR,
    "skorMaks" INTEGER,

    CONSTRAINT "AssessmentCategory_pkey" PRIMARY KEY ("idKategoriAsm")
);

-- CreateTable
CREATE TABLE "AssessmentSubmission" (
    "idSubmission" VARCHAR NOT NULL,
    "idKaryawan" VARCHAR,
    "idAssessment" VARCHAR,
    "tanggalSelesai" TIMESTAMP,
    "totalSkor" INTEGER,
    "lulus" BOOLEAN,

    CONSTRAINT "AssessmentSubmission_pkey" PRIMARY KEY ("idSubmission")
);

-- CreateTable
CREATE TABLE "AssessmentAnswer" (
    "idJawaban" VARCHAR NOT NULL,
    "idSubmission" VARCHAR,
    "idKategoriAsm" VARCHAR,
    "skor" INTEGER,

    CONSTRAINT "AssessmentAnswer_pkey" PRIMARY KEY ("idJawaban")
);

-- AddForeignKey
ALTER TABLE "SertifikatKaryawan" ADD CONSTRAINT "SertifikatKaryawan_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttachment" ADD CONSTRAINT "PaymentAttachment_idRequest_fkey" FOREIGN KEY ("idRequest") REFERENCES "PaymentRequest"("idRequest") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_idStatus_fkey" FOREIGN KEY ("idStatus") REFERENCES "MasterStatus"("idStatus") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCategory" ADD CONSTRAINT "AssessmentCategory_idAssessment_fkey" FOREIGN KEY ("idAssessment") REFERENCES "Assessment"("idAssessment") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_idAssessment_fkey" FOREIGN KEY ("idAssessment") REFERENCES "Assessment"("idAssessment") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_idSubmission_fkey" FOREIGN KEY ("idSubmission") REFERENCES "AssessmentSubmission"("idSubmission") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_idKategoriAsm_fkey" FOREIGN KEY ("idKategoriAsm") REFERENCES "AssessmentCategory"("idKategoriAsm") ON DELETE SET NULL ON UPDATE CASCADE;
