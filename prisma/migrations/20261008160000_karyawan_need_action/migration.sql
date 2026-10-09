-- AlterTable
ALTER TABLE "Karyawan" ADD COLUMN     "needAction" VARCHAR,
ADD COLUMN     "needActionAt" TIMESTAMP(3),
ADD COLUMN     "needActionBy" VARCHAR;
