-- ==========================================
-- 1. ISI TABEL MASTER & LOOKUP
-- ==========================================
INSERT INTO "Role" ("idRole", "namaRole") VALUES 
('R01', 'HR Junior'), ('R02', 'Analyst Junior'), ('R03', 'Senior Officer'), ('R04', 'Manager OPS');

INSERT INTO "Permission" ("idPermission", "namaAction") VALUES 
('P01', 'CREATE_CUTI'), ('P02', 'APPROVE_PAYMENT'), ('P03', 'VIEW_TALENT');

INSERT INTO "RolePermission" ("idRole", "idPermission") VALUES 
('R01', 'P01'), ('R02', 'P03'), ('R03', 'P02');

INSERT INTO "MasterGrade" ("idGrade", "namaGrade") VALUES 
('G01', 'Analyst'), ('G02', 'Officer'), ('G03', 'Associate');

INSERT INTO "MasterStatus" ("idStatus", "namaStatus", "kategoriModul") VALUES 
('S01', 'Pending', 'CUTI'), ('S02', 'Approved', 'CUTI'), ('S03', 'Aktif', 'KONTRAK'), ('S04', 'Approved', 'PAYMENT');

INSERT INTO "MasterJenisCuti" ("idJenisCuti", "namaJenis") VALUES 
('JC01', 'Paid Leave'), ('JC02', 'Unpaid Leave');

INSERT INTO "MasterKategoriPenyakit" ("idKategori", "namaKategori") VALUES 
('KP01', 'Demam'), ('KP02', 'Tifus');

INSERT INTO "MasterKategoriPayment" ("idKategori", "namaKategori") VALUES 
('KPY01', 'Reimbursement'), ('KPY02', 'Business Trip');

-- ==========================================
-- 2. RECRUITMENT (LOWONGAN)
-- ==========================================
INSERT INTO "LowonganKarir" ("idLowongan", "namaPosisi", "deskripsi", "idStatus", "googleFormURL") VALUES 
('L01', 'Frontend Developer', 'Membangun UI Web', 'S03', 'https://forms.gle/dummy1'),
('L02', 'Data Analyst', 'Mengolah data perusahaan', 'S03', 'https://forms.gle/dummy2');

-- ==========================================
-- 3. ISI DATA KARYAWAN & USER (DIBALIK AGAR TIDAK ERROR)
-- ==========================================

-- Masukkan data Karyawan terlebih dahulu
INSERT INTO "Karyawan" ("idKaryawan", "idUser", "nama", "tanggalLahir", "tanggalMasuk", "idGrade", "sisaCutiTahunan", "accrualRate") VALUES 
('K01', 'U01', 'Budi Santoso', '1995-05-12', '2023-01-15', 'G01', 12, 1.0),
('K02', 'U02', 'Siti Rahma', '1996-08-20', '2023-02-10', 'G02', 12, 1.0),
('K03', 'U03', 'Andi Pratama', '1990-12-01', '2022-05-01', 'G03', 10, 1.2),
('K04', 'U04', 'Dewi Lestari', '1994-03-15', '2023-06-20', 'G01', 12, 1.0),
('K05', 'U05', 'Eko Prasetyo', '1992-07-11', '2021-11-10', 'G02', 8, 1.5),
('K06', 'U06', 'Rina Melati', '1995-09-25', '2023-03-01', 'G03', 12, 1.0),
('K07', 'U07', 'Joko Susilo', '1988-04-05', '2020-01-10', 'G03', 14, 2.0),
('K08', 'U08', 'Linda Permata', '1997-01-30', '2024-01-10', 'G01', 12, 1.0),
('K09', 'U09', 'Doni Setiawan', '1993-10-18', '2022-08-15', 'G02', 11, 1.2),
('K10', 'U10', 'Siska Amelia', '1996-06-05', '2023-07-01', 'G01', 12, 1.0);

-- Baru masukkan data User setelah Karyawan tersedia
INSERT INTO "User" ("idUser", "email", "passwordHash", "idRole") VALUES 
('U01', 'budi@company.com', 'hash123', 'R01'),
('U02', 'siti@company.com', 'hash123', 'R02'),
('U03', 'andi@company.com', 'hash123', 'R03'),
('U04', 'dewi@company.com', 'hash123', 'R01'),
('U05', 'eko@company.com', 'hash123', 'R02'),
('U06', 'rina@company.com', 'hash123', 'R03'),
('U07', 'joko@company.com', 'hash123', 'R04'),
('U08', 'linda@company.com', 'hash123', 'R01'),
('U09', 'doni@company.com', 'hash123', 'R02'),
('U10', 'siska@company.com', 'hash123', 'R03');

-- ==========================================
-- 4. ISI DATA PILLARS / TRANSAKSI & PENDUKUNG
-- ==========================================

-- Pengajuan Cuti
INSERT INTO "PengajuanCuti" ("idCuti", "idKaryawan", "tanggalMulai", "tanggalSelesai", "jumlahHari", "idJenisCuti", "idStatus") VALUES 
('C01', 'K01', '2026-03-01 08:00:00', '2026-03-03 17:00:00', 3, 'JC01', 'S02'),
('C02', 'K02', '2026-03-10 08:00:00', '2026-03-10 17:00:00', 1, 'JC01', 'S01');

-- Izin Sakit
INSERT INTO "IzinSakit" ("idIzinSakit", "idKaryawan", "tanggalMulai", "tanggalSelesai", "buktiSakitURL", "idKategoriPenyakit") VALUES 
('IS01', 'K03', '2026-02-10 08:00:00', '2026-02-12 17:00:00', 'http://docs.com/sakit3.pdf', 'KP01');

-- Kontrak Karyawan
INSERT INTO "KontrakKaryawan" ("idKontrak", "idKaryawan", "tanggalMulai", "tanggalBerakhir", "idStatus", "dokumenAddendumURL", "addendumEmbedding") VALUES 
('CNT01', 'K01', '2023-01-15', '2026-01-15', 'S03', 'http://docs.com/kontrak1.pdf', 'vector_text_dummy_1'),
('CNT02', 'K02', '2023-02-10', '2026-02-10', 'S03', 'http://docs.com/kontrak2.pdf', 'vector_text_dummy_2');

-- Talent Profile
INSERT INTO "TalentProfile" ("idTalent", "idKaryawan", "idStatusAsesmen", "fileCVURL", "cvEmbedding", "isIndexedAI") VALUES 
('TP01', 'K01', 'S02', 'http://docs.com/cv1.pdf', 'vector_cv_text_1', true),
('TP02', 'K02', 'S02', 'http://docs.com/cv2.pdf', 'vector_cv_text_2', true);

-- Payment Request
INSERT INTO "PaymentRequest" ("idRequest", "idKaryawan", "projectID", "nominal", "idKategoriPayment", "idStatus", "catatan") VALUES 
('PR01', 'K01', 'PROJ-A', 500000.0, 'KPY01', 'S04', 'Reimbursement transport client'),
('PR02', 'K04', 'PROJ-B', 1500000.0, 'KPY02', 'S04', 'Business trip Bandung');

-- Audit Trail
INSERT INTO "AuditTrail" ("idAudit", "idReferensi", "idKaryawan", "tindakan", "waktu") VALUES 
('AT01', 'C01', 'K01', 'MEMBUAT_CUTI', '2026-02-28 10:00:00'),
('AT02', 'PR01', 'K01', 'MEMBUAT_PAYMENT', '2026-03-01 14:30:00');