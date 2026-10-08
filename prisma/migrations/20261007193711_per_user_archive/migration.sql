-- AlterTable
ALTER TABLE "Mading" DROP COLUMN "doneAt",
DROP COLUMN "isDone";

-- AlterTable
ALTER TABLE "MadingUserState" ADD COLUMN     "doneAt" TIMESTAMP,
ADD COLUMN     "isDone" BOOLEAN NOT NULL DEFAULT false;