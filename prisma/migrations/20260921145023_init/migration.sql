-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_idUser_fkey";

-- AddForeignKey
ALTER TABLE "Karyawan" ADD CONSTRAINT "Karyawan_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("idUser") ON DELETE SET NULL ON UPDATE CASCADE;
