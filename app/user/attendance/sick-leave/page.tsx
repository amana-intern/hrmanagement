"use client";

import { useState } from "react";
import SidebarUser from "../../../components/Sidebar/SidebarUser/Sidebaruser";

export default function SickLeavePage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [medicalFile, setMedicalFile] = useState<File | null>(null);

  // Validasi: Tombol aktif jika tanggal mulai, tanggal akhir, dan file sudah diisi
  const isFormValid = startDate !== "" && endDate !== "" && medicalFile !== null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedicalFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    alert("Sick Leave berhasil disubmit!");
  };

  return (
    <div className="flex min-h-screen bg-amana-white font-sans text-amana-black">
      <SidebarUser />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto flex flex-col gap-8 w-full">
          
          <h1 className="text-3xl font-semibold text-amana-blue">
            Sick Leave - User
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {/* Form Date Section */}
            <div className="bg-white p-6 rounded-2xl border border-amana-sec-6 shadow-xs">
              <h2 className="text-xl font-semibold mb-4 text-amana-blue">Sick Leave Schedule</h2>
              <div className="flex flex-col gap-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-amana-sec-7 mb-1">When are you leaving?</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-amana-sec-6 px-4 py-3 rounded-xl text-amana-blue focus:outline-none focus:ring-2 focus:ring-amana-blue text-sm bg-amana-white cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amana-sec-7 mb-1">When will you be back?</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-amana-sec-6 px-4 py-3 rounded-xl text-amana-blue focus:outline-none focus:ring-2 focus:ring-amana-blue text-sm bg-amana-white cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Upload Medical Certificate Section */}
            <div className="bg-white p-6 rounded-2xl border border-amana-sec-6 shadow-xs relative min-h-[300px] flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-4 text-amana-blue">Upload Medical Certificate</h2>
                
                <div className="relative flex h-44 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-amana-sec-6 rounded-2xl bg-amana-white hover:bg-white transition">
                  <input
                    type="file"
                    accept="application/pdf, image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <svg className="mb-2 h-10 w-10 text-amana-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm font-semibold text-amana-blue">
                    {medicalFile ? medicalFile.name : "Drag Images/PDF or Click to Browse"}
                  </span>
                  <span className="text-xs text-amana-sec-7 mt-1 font-light">Format PDF / Image (Max 5MB)</span>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`px-8 py-2.5 rounded-xl font-semibold text-sm transition shadow-xs ${
                    isFormValid
                      ? "bg-amana-blue text-white hover:bg-amana-sec-5 cursor-pointer"
                      : "bg-amana-sec-6 text-amana-sec-7 cursor-not-allowed opacity-60"
                  }`}
                >
                  Submit
                </button>
              </div>
            </div>
          </form>

        </div>
      </main>
    </div>
  );
}