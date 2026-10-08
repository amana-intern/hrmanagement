-- DropForeignKey
ALTER TABLE "HrTodo" DROP CONSTRAINT "HrTodo_idKaryawan_fkey";

-- DropTable
DROP TABLE "HrTodo";

-- CreateTable
CREATE TABLE "Mading" (
    "idMading" VARCHAR NOT NULL,
    "judul" VARCHAR,
    "pesan" TEXT,
    "audience" TEXT DEFAULT 'ALL',
    "tanggalMulai" TIMESTAMP,
    "tanggalSelesai" TIMESTAMP,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "createdBy" VARCHAR,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mading_pkey" PRIMARY KEY ("idMading")
);

-- CreateTable
CREATE TABLE "MadingRecipient" (
    "idMading" VARCHAR NOT NULL,
    "idKaryawan" VARCHAR NOT NULL,

    CONSTRAINT "MadingRecipient_pkey" PRIMARY KEY ("idMading","idKaryawan")
);

-- CreateTable
CREATE TABLE "MadingUserState" (
    "idMading" VARCHAR NOT NULL,
    "idKaryawan" VARCHAR NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP,

    CONSTRAINT "MadingUserState_pkey" PRIMARY KEY ("idMading","idKaryawan")
);

-- AddForeignKey
ALTER TABLE "MadingRecipient" ADD CONSTRAINT "MadingRecipient_idMading_fkey" FOREIGN KEY ("idMading") REFERENCES "Mading"("idMading") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MadingRecipient" ADD CONSTRAINT "MadingRecipient_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MadingUserState" ADD CONSTRAINT "MadingUserState_idMading_fkey" FOREIGN KEY ("idMading") REFERENCES "Mading"("idMading") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MadingUserState" ADD CONSTRAINT "MadingUserState_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE CASCADE ON UPDATE CASCADE;
