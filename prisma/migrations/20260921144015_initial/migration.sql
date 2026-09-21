-- CreateTable
CREATE TABLE "User" (
    "idUser" VARCHAR NOT NULL,
    "email" VARCHAR,
    "passwordHash" VARCHAR,
    "googleSub" VARCHAR,
    "pictureUrl" VARCHAR(500),
    "idRole" VARCHAR,

    CONSTRAINT "User_pkey" PRIMARY KEY ("idUser")
);

-- CreateTable
CREATE TABLE "Role" (
    "idRole" VARCHAR NOT NULL,
    "namaRole" VARCHAR,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("idRole")
);

-- CreateTable
CREATE TABLE "Permission" (
    "idPermission" VARCHAR NOT NULL,
    "namaAction" VARCHAR,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("idPermission")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "idRole" VARCHAR NOT NULL,
    "idPermission" VARCHAR NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("idRole","idPermission")
);

-- CreateTable
CREATE TABLE "MasterGrade" (
    "idGrade" VARCHAR NOT NULL,
    "namaGrade" VARCHAR,

    CONSTRAINT "MasterGrade_pkey" PRIMARY KEY ("idGrade")
);

-- CreateTable
CREATE TABLE "MasterDepartment" (
    "idDepartment" VARCHAR NOT NULL,
    "namaDepartment" VARCHAR,
    "urutan" INTEGER,

    CONSTRAINT "MasterDepartment_pkey" PRIMARY KEY ("idDepartment")
);

-- CreateTable
CREATE TABLE "MasterStatus" (
    "idStatus" VARCHAR NOT NULL,
    "namaStatus" VARCHAR,
    "kategoriModul" VARCHAR,

    CONSTRAINT "MasterStatus_pkey" PRIMARY KEY ("idStatus")
);

-- CreateTable
CREATE TABLE "MasterJenisCuti" (
    "idJenisCuti" VARCHAR NOT NULL,
    "namaJenis" VARCHAR,

    CONSTRAINT "MasterJenisCuti_pkey" PRIMARY KEY ("idJenisCuti")
);

-- CreateTable
CREATE TABLE "MasterKategoriPenyakit" (
    "idKategori" VARCHAR NOT NULL,
    "namaKategori" VARCHAR,

    CONSTRAINT "MasterKategoriPenyakit_pkey" PRIMARY KEY ("idKategori")
);

-- CreateTable
CREATE TABLE "MasterKategoriPayment" (
    "idKategori" VARCHAR NOT NULL,
    "namaKategori" VARCHAR,

    CONSTRAINT "MasterKategoriPayment_pkey" PRIMARY KEY ("idKategori")
);

-- CreateTable
CREATE TABLE "Karyawan" (
    "idKaryawan" VARCHAR NOT NULL,
    "idUser" VARCHAR,
    "nama" VARCHAR,
    "tanggalLahir" DATE,
    "tanggalMasuk" DATE,
    "idGrade" VARCHAR,
    "department" VARCHAR,
    "departments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "noTelepon" VARCHAR,
    "sisaCutiTahunan" DOUBLE PRECISION DEFAULT 12,
    "accrualRate" DOUBLE PRECISION,
    "tipeKontrak" VARCHAR DEFAULT 'PKWT',

    CONSTRAINT "Karyawan_pkey" PRIMARY KEY ("idKaryawan")
);

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
CREATE TABLE "PengajuanCuti" (
    "idCuti" VARCHAR NOT NULL,
    "idKaryawan" VARCHAR,
    "tanggalMulai" TIMESTAMP,
    "tanggalSelesai" TIMESTAMP,
    "jumlahHari" INTEGER,
    "idJenisCuti" VARCHAR,
    "idStatus" VARCHAR,
    "tanggalPengajuan" TIMESTAMP,
    "disetujuiOleh" VARCHAR,
    "tanggalApproval" TIMESTAMP,
    "catatan" VARCHAR,
    "keterangan" VARCHAR,
    "tanggalKerjaHariLibur" TIMESTAMP,
    "tanggalSelesaiKerjaLibur" TIMESTAMP,
    "tipeCutiKompensasi" VARCHAR,
    "jumlahHariKompensasi" DOUBLE PRECISION,

    CONSTRAINT "PengajuanCuti_pkey" PRIMARY KEY ("idCuti")
);

-- CreateTable
CREATE TABLE "IzinSakit" (
    "idIzinSakit" VARCHAR NOT NULL,
    "idKaryawan" VARCHAR,
    "tanggalMulai" TIMESTAMP,
    "tanggalSelesai" TIMESTAMP,
    "gejala" VARCHAR,
    "buktiSakitURL" VARCHAR,
    "idKategoriPenyakit" VARCHAR,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IzinSakit_pkey" PRIMARY KEY ("idIzinSakit")
);

-- CreateTable
CREATE TABLE "KontrakKaryawan" (
    "idKontrak" VARCHAR NOT NULL,
    "idKaryawan" VARCHAR,
    "tanggalMulai" DATE,
    "tanggalBerakhir" DATE,
    "idStatus" VARCHAR,
    "carryOver" DOUBLE PRECISION DEFAULT 0,
    "annualQuota" INTEGER DEFAULT 12,
    "dokumenAddendumURL" VARCHAR,
    "addendumEmbedding" TEXT,
    "needAction" VARCHAR,
    "needActionAt" TIMESTAMP(3),
    "needActionBy" VARCHAR,
    "cutiKompensasi" DOUBLE PRECISION DEFAULT 0,
    "cutiTerpakaiAwal" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "KontrakKaryawan_pkey" PRIMARY KEY ("idKontrak")
);

-- CreateTable
CREATE TABLE "TalentProfile" (
    "idTalent" VARCHAR NOT NULL,
    "idKaryawan" VARCHAR,
    "idStatusAsesmen" VARCHAR,
    "fileCVURL" VARCHAR,
    "cvEmbedding" TEXT,
    "isIndexedAI" BOOLEAN,

    CONSTRAINT "TalentProfile_pkey" PRIMARY KEY ("idTalent")
);

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "idRequest" VARCHAR NOT NULL,
    "idKaryawan" VARCHAR,
    "projectID" VARCHAR,
    "nominal" DOUBLE PRECISION,
    "idKategoriPayment" VARCHAR,
    "idStatus" VARCHAR,
    "catatan" VARCHAR,
    "detail" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "tanggalPengajuan" TIMESTAMP,
    "disetujuiOleh" VARCHAR,
    "tanggalApproval" TIMESTAMP,
    "tanggalJadwalPembayaran" TIMESTAMP,
    "tanggalLunas" TIMESTAMP,
    "partnerDepartment" VARCHAR,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("idRequest")
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
CREATE TABLE "AuditTrail" (
    "idAudit" VARCHAR NOT NULL,
    "idReferensi" VARCHAR,
    "idKaryawan" VARCHAR,
    "idAktor" VARCHAR,
    "aktorNama" VARCHAR,
    "tindakan" VARCHAR,
    "perubahan" JSONB,
    "waktu" TIMESTAMP,

    CONSTRAINT "AuditTrail_pkey" PRIMARY KEY ("idAudit")
);

-- CreateTable
CREATE TABLE "LowonganKarir" (
    "idLowongan" VARCHAR NOT NULL,
    "namaPosisi" VARCHAR,
    "deskripsi" VARCHAR,
    "idStatus" VARCHAR,
    "googleFormURL" VARCHAR,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP,

    CONSTRAINT "LowonganKarir_pkey" PRIMARY KEY ("idLowongan")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "idAssessment" VARCHAR NOT NULL,
    "judul" VARCHAR,
    "deskripsi" VARCHAR,
    "tanggalBuka" TIMESTAMP,
    "tanggalTutup" TIMESTAMP,
    "idStatus" VARCHAR,
    "autoOpened" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("idAssessment")
);

-- CreateTable
CREATE TABLE "AssessmentCategory" (
    "idKategoriAsm" VARCHAR NOT NULL,
    "idAssessment" VARCHAR,
    "namaKategori" VARCHAR,

    CONSTRAINT "AssessmentCategory_pkey" PRIMARY KEY ("idKategoriAsm")
);

-- CreateTable
CREATE TABLE "AssessmentSubmission" (
    "idSubmission" VARCHAR NOT NULL,
    "idKaryawan" VARCHAR,
    "idAssessment" VARCHAR,
    "tanggalSelesai" TIMESTAMP,
    "technicalSkills" TEXT,
    "selfDevelopmentAreas" TEXT,

    CONSTRAINT "AssessmentSubmission_pkey" PRIMARY KEY ("idSubmission")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "idPertanyaan" VARCHAR NOT NULL,
    "idKategoriAsm" VARCHAR,
    "teks" VARCHAR,
    "urutan" INTEGER,
    "tipeSoal" VARCHAR,
    "gridId" VARCHAR,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("idPertanyaan")
);

-- CreateTable
CREATE TABLE "AssessmentQuestionOption" (
    "idOpsi" VARCHAR NOT NULL,
    "idPertanyaan" VARCHAR,
    "teks" VARCHAR,
    "urutan" INTEGER,

    CONSTRAINT "AssessmentQuestionOption_pkey" PRIMARY KEY ("idOpsi")
);

-- CreateTable
CREATE TABLE "AssessmentAnswer" (
    "idJawaban" VARCHAR NOT NULL,
    "idSubmission" VARCHAR,
    "idPertanyaan" VARCHAR,
    "level" INTEGER,
    "pilihan" JSONB,
    "jawabanTeks" VARCHAR,

    CONSTRAINT "AssessmentAnswer_pkey" PRIMARY KEY ("idJawaban")
);

-- CreateTable
CREATE TABLE "HrTodo" (
    "idTodo" VARCHAR NOT NULL,
    "idKaryawan" VARCHAR,
    "teks" VARCHAR,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "modul" VARCHAR,
    "idReferensi" VARCHAR,

    CONSTRAINT "HrTodo_pkey" PRIMARY KEY ("idTodo")
);

-- CreateTable
CREATE TABLE "ApprovalHistory" (
    "idHistory" VARCHAR NOT NULL,
    "idReferensi" VARCHAR,
    "modul" VARCHAR,
    "actorIdUser" VARCHAR,
    "action" VARCHAR,
    "catatan" VARCHAR,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalHistory_pkey" PRIMARY KEY ("idHistory")
);

-- CreateTable
CREATE TABLE "Notification" (
    "idNotif" VARCHAR NOT NULL,
    "idKaryawan" VARCHAR,
    "tipe" VARCHAR,
    "judul" VARCHAR,
    "pesan" VARCHAR,
    "idReferensi" VARCHAR,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("idNotif")
);

-- CreateTable
CREATE TABLE "TanggalBlokir" (
    "idBlokir" VARCHAR NOT NULL,
    "tanggal" DATE,
    "tanggalAkhir" DATE,
    "alasan" VARCHAR,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TanggalBlokir_pkey" PRIMARY KEY ("idBlokir")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");

-- CreateIndex
CREATE UNIQUE INDEX "Karyawan_idUser_key" ON "Karyawan"("idUser");

-- CreateIndex
CREATE UNIQUE INDEX "TalentProfile_idKaryawan_key" ON "TalentProfile"("idKaryawan");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_idRole_fkey" FOREIGN KEY ("idRole") REFERENCES "Role"("idRole") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "Karyawan"("idUser") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_idRole_fkey" FOREIGN KEY ("idRole") REFERENCES "Role"("idRole") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_idPermission_fkey" FOREIGN KEY ("idPermission") REFERENCES "Permission"("idPermission") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Karyawan" ADD CONSTRAINT "Karyawan_idGrade_fkey" FOREIGN KEY ("idGrade") REFERENCES "MasterGrade"("idGrade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Karyawan" ADD CONSTRAINT "Karyawan_department_fkey" FOREIGN KEY ("department") REFERENCES "MasterDepartment"("idDepartment") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SertifikatKaryawan" ADD CONSTRAINT "SertifikatKaryawan_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengajuanCuti" ADD CONSTRAINT "PengajuanCuti_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengajuanCuti" ADD CONSTRAINT "PengajuanCuti_idJenisCuti_fkey" FOREIGN KEY ("idJenisCuti") REFERENCES "MasterJenisCuti"("idJenisCuti") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengajuanCuti" ADD CONSTRAINT "PengajuanCuti_idStatus_fkey" FOREIGN KEY ("idStatus") REFERENCES "MasterStatus"("idStatus") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IzinSakit" ADD CONSTRAINT "IzinSakit_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IzinSakit" ADD CONSTRAINT "IzinSakit_idKategoriPenyakit_fkey" FOREIGN KEY ("idKategoriPenyakit") REFERENCES "MasterKategoriPenyakit"("idKategori") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KontrakKaryawan" ADD CONSTRAINT "KontrakKaryawan_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KontrakKaryawan" ADD CONSTRAINT "KontrakKaryawan_idStatus_fkey" FOREIGN KEY ("idStatus") REFERENCES "MasterStatus"("idStatus") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentProfile" ADD CONSTRAINT "TalentProfile_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentProfile" ADD CONSTRAINT "TalentProfile_idStatusAsesmen_fkey" FOREIGN KEY ("idStatusAsesmen") REFERENCES "MasterStatus"("idStatus") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_idKategoriPayment_fkey" FOREIGN KEY ("idKategoriPayment") REFERENCES "MasterKategoriPayment"("idKategori") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_idStatus_fkey" FOREIGN KEY ("idStatus") REFERENCES "MasterStatus"("idStatus") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttachment" ADD CONSTRAINT "PaymentAttachment_idRequest_fkey" FOREIGN KEY ("idRequest") REFERENCES "PaymentRequest"("idRequest") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditTrail" ADD CONSTRAINT "AuditTrail_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_idStatus_fkey" FOREIGN KEY ("idStatus") REFERENCES "MasterStatus"("idStatus") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCategory" ADD CONSTRAINT "AssessmentCategory_idAssessment_fkey" FOREIGN KEY ("idAssessment") REFERENCES "Assessment"("idAssessment") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_idAssessment_fkey" FOREIGN KEY ("idAssessment") REFERENCES "Assessment"("idAssessment") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_idKategoriAsm_fkey" FOREIGN KEY ("idKategoriAsm") REFERENCES "AssessmentCategory"("idKategoriAsm") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestionOption" ADD CONSTRAINT "AssessmentQuestionOption_idPertanyaan_fkey" FOREIGN KEY ("idPertanyaan") REFERENCES "AssessmentQuestion"("idPertanyaan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_idSubmission_fkey" FOREIGN KEY ("idSubmission") REFERENCES "AssessmentSubmission"("idSubmission") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_idPertanyaan_fkey" FOREIGN KEY ("idPertanyaan") REFERENCES "AssessmentQuestion"("idPertanyaan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrTodo" ADD CONSTRAINT "HrTodo_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryawanHistory" ADD CONSTRAINT "KaryawanHistory_idKaryawan_fkey" FOREIGN KEY ("idKaryawan") REFERENCES "Karyawan"("idKaryawan") ON DELETE SET NULL ON UPDATE CASCADE;
