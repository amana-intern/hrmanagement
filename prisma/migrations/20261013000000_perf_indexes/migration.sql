-- Performa: index untuk kolom FK & filter panas.
-- Sebelumnya seluruh tabel tanpa secondary index sehingga setiap join/filter
-- ke kolom ini melakukan sequential scan yang makin lambat seiring data tumbuh.

-- CreateIndex
CREATE INDEX "SertifikatKaryawan_idKaryawan_idx" ON "SertifikatKaryawan"("idKaryawan");

-- CreateIndex
CREATE INDEX "PengajuanCuti_idKaryawan_idStatus_idx" ON "PengajuanCuti"("idKaryawan", "idStatus");

-- CreateIndex
CREATE INDEX "PengajuanCuti_tanggalMulai_idx" ON "PengajuanCuti"("tanggalMulai");

-- CreateIndex
CREATE INDEX "IzinSakit_idKaryawan_idx" ON "IzinSakit"("idKaryawan");

-- CreateIndex
CREATE INDEX "KontrakKaryawan_idKaryawan_idx" ON "KontrakKaryawan"("idKaryawan");

-- CreateIndex
CREATE INDEX "PaymentRequest_idKaryawan_idStatus_idx" ON "PaymentRequest"("idKaryawan", "idStatus");

-- CreateIndex
CREATE INDEX "PaymentAttachment_idRequest_idx" ON "PaymentAttachment"("idRequest");

-- CreateIndex
CREATE INDEX "AuditTrail_idKaryawan_idx" ON "AuditTrail"("idKaryawan");

-- CreateIndex
CREATE INDEX "AssessmentCategory_idAssessment_idx" ON "AssessmentCategory"("idAssessment");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_idKaryawan_idAssessment_idx" ON "AssessmentSubmission"("idKaryawan", "idAssessment");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_idKategoriAsm_idx" ON "AssessmentQuestion"("idKategoriAsm");

-- CreateIndex
CREATE INDEX "AssessmentQuestionOption_idPertanyaan_idx" ON "AssessmentQuestionOption"("idPertanyaan");

-- CreateIndex
CREATE INDEX "AssessmentAnswer_idSubmission_idx" ON "AssessmentAnswer"("idSubmission");

-- CreateIndex
CREATE INDEX "AssessmentAnswer_idPertanyaan_idx" ON "AssessmentAnswer"("idPertanyaan");

-- CreateIndex
CREATE INDEX "Notification_idKaryawan_isRead_createdAt_idx" ON "Notification"("idKaryawan", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "KaryawanHistory_idKaryawan_idx" ON "KaryawanHistory"("idKaryawan");
