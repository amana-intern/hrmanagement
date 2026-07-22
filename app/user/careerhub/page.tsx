"use client";

import React, { useState, useRef } from "react";
import SidebarUser from "../../components/Sidebar/SidebarUser/Sidebaruser";

interface Certification {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string;
}

export default function CareerHubPage() {
  // 1. Assessment Test State
  const [hasTakenAssessment, setHasTakenAssessment] = useState<boolean>(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState<boolean>(false);

  // 2. Latest CV State
  const [cvFile, setCvFile] = useState<{ name: string; url: string } | null>({
    name: "CV_User_Latest.pdf",
    url: "",
  });
  const cvInputRef = useRef<HTMLInputElement>(null);

  // 3. Latest Certification State
  const [certifications, setCertifications] = useState<Certification[]>([
    {
      id: "1",
      title: "Certification IT Engineer",
      fileUrl: "",
      fileName: "Certification_it_engineer.pdf",
    },
    {
      id: "2",
      title: "Certification Matlab Course",
      fileUrl: "",
      fileName: "Certification_matlab.pdf",
    },
  ]);

  // 4. Upload / Edit Certification Modal State
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [certTitleInput, setCertTitleInput] = useState<string>("");
  const [selectedCertFile, setSelectedCertFile] = useState<File | null>(null);

  // PDF Preview Modal State
  const [previewPdf, setPreviewPdf] = useState<{ title: string; url: string } | null>(null);

  // --- Handlers ---
  const handleCompleteAssessment = () => {
    setHasTakenAssessment(true);
    setIsAssessmentModalOpen(false);
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setCvFile({ name: file.name, url });
    } else {
      alert("Harap unggah file berformat .pdf!");
    }
  };

  const openAddCertModal = () => {
    setEditingCertId(null);
    setCertTitleInput("");
    setSelectedCertFile(null);
    setIsCertModalOpen(true);
  };

  const openUpdateCertModal = (cert: Certification) => {
    setEditingCertId(cert.id);
    setCertTitleInput(cert.title);
    setSelectedCertFile(null);
    setIsCertModalOpen(true);
  };

  const handleSaveCertification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitleInput.trim()) {
      alert("Title Must Be Filled!");
      return;
    }

    const fileUrl = selectedCertFile ? URL.createObjectURL(selectedCertFile) : "";
    const fileName = selectedCertFile ? selectedCertFile.name : "document.pdf";

    if (editingCertId) {
      setCertifications((prev) =>
        prev.map((item) =>
          item.id === editingCertId
            ? {
                ...item,
                title: certTitleInput,
                ...(selectedCertFile && { fileUrl, fileName }),
              }
            : item
        )
      );
    } else {
      const newCert: Certification = {
        id: Date.now().toString(),
        title: certTitleInput,
        fileUrl,
        fileName,
      };
      setCertifications((prev) => [...prev, newCert]);
    }

    setIsCertModalOpen(false);
  };

  // Handler Hapus Certification
  const handleDeleteCertification = (id: string) => {
    if (window.confirm("Are you sure to delete this certification?")) {
      setCertifications((prev) => prev.filter((item) => item.id !== id));
      setIsCertModalOpen(false);
    }
  };

  const handleViewPdf = (title: string, url: string) => {
    if (!url) {
      alert(`Opening PDF Simulation: ${title}`);
      return;
    }
    setPreviewPdf({ title, url });
  };

  return (
    <div className="flex min-h-screen bg-amana-white text-amana-black">
      {/* 1. SIDEBAR */}
      <SidebarUser />

      {/* 2. MAIN CONTENT AREA (Posisikan di tengah dengan mx-auto & max-w-5xl) */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto flex flex-col gap-8 w-full">
          {/* Header Title */}
          <h1 className="text-3xl font-semibold text-amana-blue">
            Career Hub - User
          </h1>

          {/* SECTION 1: Competency Assessment Test */}
          <div className="bg-white p-6 rounded-2xl border border-amana-sec-6 shadow-xs">
            <h2 className="text-xl font-semibold mb-4 text-amana-blue">
              Competency Assessment Test
            </h2>
            <div className="p-4 rounded-xl bg-amana-white border border-amana-sec-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                {hasTakenAssessment ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm sm:text-base">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>You have taken your assessment test!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm sm:text-base">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Please take your assessment test!</span>
                  </div>
                )}
              </div>
              <button
                onClick={() =>
                  hasTakenAssessment
                    ? setHasTakenAssessment(false)
                    : setIsAssessmentModalOpen(true)
                }
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  hasTakenAssessment
                    ? "bg-amana-sec-6 hover:bg-amana-sec-7/20 text-amana-black"
                    : "bg-amana-blue hover:bg-amana-sec-5 text-white shadow-xs"
                }`}
              >
                {hasTakenAssessment ? "Reset Status" : "Take Assessment"}
              </button>
            </div>
          </div>

          {/* SECTION 2 & 3: Grid 2 Column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SECTION 2: Latest CV (PDF) */}
            <div className="bg-white p-6 rounded-2xl border border-amana-sec-6 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-amana-blue mb-4">
                  Latest CV <span className="text-sm font-light text-amana-sec-7">(PDF)</span>
                </h2>

                <div className="border-2 border-dashed border-amana-sec-6 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px] bg-amana-white">
                  <img
                    src="/icon/BCarrerHub.png"
                    alt="Career Hub Icon"
                    className="w-14 h-14 object-contain mb-3"
                  />
                  <p className="font-semibold text-amana-black text-center text-sm">
                    {cvFile ? cvFile.name : "No CV Uploaded"}
                  </p>
                  <p className="text-xs text-amana-sec-7 mt-1 font-light">Format PDF (Max 5MB)</p>
                </div>
              </div>

              <input
                type="file"
                ref={cvInputRef}
                onChange={handleCvChange}
                accept="application/pdf"
                className="hidden"
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => cvFile && handleViewPdf("Latest CV", cvFile.url)}
                  className="flex-1 py-2.5 px-4 border border-amana-blue text-amana-blue rounded-xl hover:bg-amana-sec-2/20 font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </button>
                <button
                  onClick={() => cvInputRef.current?.click()}
                  className="flex-1 py-2.5 px-4 bg-amana-blue text-white rounded-xl hover:bg-amana-sec-5 font-semibold text-sm flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Update
                </button>
              </div>
            </div>

            {/* SECTION 3: Latest Certification (PDF) */}
            <div className="bg-white p-6 rounded-2xl border border-amana-sec-6 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-amana-blue mb-4">
                  Latest Certification <span className="text-sm font-light text-amana-sec-7">(PDF)</span>
                </h2>

                <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-1">
                  {certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between p-3 border border-amana-sec-6 rounded-xl bg-amana-white"
                    >
                      <div className="flex items-center gap-3 overflow-hidden mr-2">
                        <img
                          src="/icon/BCarrerHub.png"
                          alt="Cert Icon"
                          className="w-5 h-5 object-contain flex-shrink-0"
                        />
                        <span className="font-semibold text-sm truncate text-amana-black">
                          {cert.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleViewPdf(cert.title, cert.fileUrl)}
                          className="text-xs font-semibold text-amana-blue hover:underline px-2 py-1"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openUpdateCertModal(cert)}
                          className="text-xs bg-amana-sec-6 hover:bg-amana-sec-7/20 px-3 py-1.5 rounded-lg text-amana-black font-semibold transition"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-amana-sec-6 pt-4 flex justify-end">
                <button
                  onClick={openAddCertModal}
                  className="py-2.5 px-6 border border-dashed border-amana-blue text-amana-blue rounded-xl hover:bg-amana-sec-2/20 font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* --- MODAL SECTION: Upload / Edit Certification --- */}
      {isCertModalOpen && (
        <div className="fixed inset-0 z-50 bg-amana-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setIsCertModalOpen(false)}
              className="absolute top-5 right-5 text-amana-sec-7 hover:text-amana-black transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-semibold text-amana-blue mb-6">
              {editingCertId ? "Update Certification" : "Upload Certification"}
            </h3>

            <form onSubmit={handleSaveCertification} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-amana-black mb-1.5">
                  Certification Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Sertification Title"
                  value={certTitleInput}
                  onChange={(e) => setCertTitleInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-amana-sec-6 rounded-xl focus:ring-2 focus:ring-amana-blue focus:border-transparent outline-none text-sm font-normal text-amana-black"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-amana-black mb-1.5">
                  Certification Document (.pdf)
                </label>
                <div className="relative border-2 border-dashed border-amana-sec-6 rounded-2xl p-10 flex flex-col items-center justify-center bg-amana-white hover:bg-white transition cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setSelectedCertFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <svg className="w-12 h-12 text-amana-blue mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-sm font-semibold text-amana-black">
                    {selectedCertFile ? selectedCertFile.name : "Drag Certification PDF Here"}
                  </p>
                  <p className="text-xs text-amana-sec-7 mt-1 font-light">or Click to Select File</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3">
                {/* Opsi Delete hanya muncul jika sedang dalam mode Update/Edit */}
                {editingCertId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteCertification(editingCertId)}
                    className="px-4 py-2.5 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold text-sm transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCertModalOpen(false)}
                    className="px-5 py-2.5 border border-amana-sec-6 text-amana-sec-7-5 rounded-xl hover:bg-amana-white font-semibold text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amana-blue text-white rounded-xl hover:bg-amana-sec-5 font-semibold text-sm transition shadow-xs"
                  >
                    {editingCertId ? "Save Changes" : "Upload"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL ASSESSMENT TEST --- */}
      {isAssessmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-amana-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
            <h3 className="text-xl font-semibold text-amana-blue mb-3">
              Competency Assessment
            </h3>
            <p className="text-sm text-amana-sec-7-5 mb-6 font-light">
                Simulation Assesment Test
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsAssessmentModalOpen(false)}
                className="px-4 py-2 text-amana-sec-7-5 hover:bg-amana-white rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteAssessment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Finish Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL PDF PREVIEW --- */}
      {previewPdf && (
        <div className="fixed inset-0 z-50 bg-amana-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl h-[80vh] rounded-2xl flex flex-col relative overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-amana-sec-6 flex items-center justify-between bg-amana-white">
              <h4 className="font-semibold text-amana-black">{previewPdf.title}</h4>
              <button
                onClick={() => setPreviewPdf(null)}
                className="text-amana-sec-7 hover:text-amana-black transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4 bg-amana-white">
              {previewPdf.url ? (
                <iframe
                  src={previewPdf.url}
                  className="w-full h-full rounded-xl border border-amana-sec-6"
                  title="PDF Viewer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-amana-sec-7">
                  <img
                    src="/icon/BCarrerHub.png"
                    alt="Preview"
                    className="w-16 h-16 mb-3 opacity-50"
                  />
                  <p className="font-semibold text-sm">PDF Preview Simulation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}