-- AlterTable
ALTER TABLE "User" ADD COLUMN "googleSub" VARCHAR;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");