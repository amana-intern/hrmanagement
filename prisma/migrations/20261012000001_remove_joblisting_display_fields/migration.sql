-- Hapus field display website dari HRIS (master = HRIS, Framer hanya Title/Employment/Apply URL/Description)
ALTER TABLE "LowonganKarir" DROP COLUMN "ringkasan";
ALTER TABLE "LowonganKarir" DROP COLUMN "lokasi";
ALTER TABLE "LowonganKarir" DROP COLUMN "departemen";
