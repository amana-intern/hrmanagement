-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN "autoOpened" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AssessmentQuestion" ADD COLUMN "gridId" VARCHAR;
