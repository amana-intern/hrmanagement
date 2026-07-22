"use client";

import { useState } from "react";
import SidebarUser from "../../../components/Sidebar/SidebarUser/Sidebaruser";

export default function LeaveRequestPage() {
  const [selectedLeave, setSelectedLeave] = useState<string>("");
  const [selectedSpecialLeave, setSelectedSpecialLeave] = useState<string>("");

  const specialLeaveList = [
    "sakit karena haid (2)",
    "menikah (3)",
    "menikahkan anak (2)",
    "mengkhitankan (2)",
    "membaptis anak (2)",
    "istri melahirkan (2)",
    "salah satu anggota keluarga meninggal dunia (2)",
    "Anggota keluarga serumah meninggal dunia (1)"
  ];

  // Logika validasi: Tombol submit aktif jika leave sudah dipilih, 
  // dan jika Special Leave, rinciannya juga harus dipilih.
  const isFormValid = selectedLeave !== "" && (selectedLeave !== "Special Leave" || selectedSpecialLeave !== "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    alert("Leave Request berhasil disubmit!");
  };

  // Styling konsisten sesuai tema globals.css (Amati penggunaan variable dan warna amana)
  const inputClassName = "w-full md:w-1/2 px-4 py-3 bg-white border border-amana-sec-6 rounded-xl focus:border-amana-blue focus:ring-1 focus:ring-amana-blue outline-none text-sm font-normal transition-all text-amana-black shadow-xs cursor-pointer";
  const labelClassName = "block text-sm font-semibold text-amana-black mb-1.5";

  return (
    <div className="flex min-h-screen bg-amana-white font-sans text-amana-black">
      <SidebarUser />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto flex flex-col gap-8 w-full">
          
          <h1 className="text-3xl font-semibold text-amana-blue">
            Leave Request - User
          </h1>

          {/* Leave Balance Section */}
          <div className="bg-white p-6 rounded-2xl border border-amana-sec-6 shadow-xs">
            <h2 className="text-xl font-semibold mb-4 text-amana-blue">Leave Balance</h2>
            <div className="flex gap-6 flex-wrap">
              {[
                { count: "12", label: "Paid Leave" },
                { count: "0", label: "Special Leave" },
                { count: "0", label: "Unpaid Leave" }
              ].map((item, idx) => (
                <div key={idx} className="flex h-24 w-40 flex-col items-center justify-center border border-amana-sec-6 rounded-xl bg-amana-white shadow-xs">
                  <span className="text-xl font-semibold text-amana-blue">{item.count}</span>
                  <span className="text-sm text-amana-sec-7 font-light">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Request Form Section */}
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-amana-sec-6 shadow-xs flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-amana-blue">Request Leave</h2>
            
            {/* Dropdown Pilihan Utama Leave */}
            <div className="flex flex-col gap-2">
              <label className={labelClassName}>Leave Option</label>
              <select
                value={selectedLeave}
                onChange={(e) => {
                  setSelectedLeave(e.target.value);
                  if (e.target.value !== "Special Leave") {
                    setSelectedSpecialLeave("");
                  }
                }}
                className={`${inputClassName} appearance-none font-medium`}
              >
                <option value="" disabled hidden>Select Leave Option...</option>
                <option value="Paid Leave">Paid Leave</option>
                <option value="Special Leave">Special Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>
            </div>

            {/* Sub-pilihan khusus jika Special Leave dipilih */}
            {selectedLeave === "Special Leave" && (
              <div className="flex flex-col gap-3 animate-fade-in border border-amana-sec-6 bg-amana-white p-5 rounded-xl max-w-lg shadow-xs">
                <h3 className="font-semibold text-amana-blue text-sm">List Special Leave (Pilih salah satu)</h3>
                <div className="flex flex-col gap-2.5">
                  {specialLeaveList.map((item, idx) => (
                    <label key={idx} className="flex items-start gap-3 cursor-pointer text-sm font-medium text-amana-black hover:text-amana-blue transition">
                      <input 
                        type="radio" 
                        name="specialLeaveType"
                        checked={selectedSpecialLeave === item}
                        onChange={() => setSelectedSpecialLeave(item)}
                        className="mt-0.5 accent-amana-blue cursor-pointer" 
                      /> 
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tombol Submit dengan efek hover solid */}
            <div className="flex justify-end pt-4 border-t border-amana-sec-6">
              <button
                type="submit"
                disabled={!isFormValid}
                className={`px-7 py-2.5 rounded-xl font-semibold text-sm transition shadow-xs ${
                  isFormValid
                    ? "bg-amana-blue text-white hover:bg-amana-sec-5 cursor-pointer"
                    : "bg-amana-sec-6 text-amana-sec-7 cursor-not-allowed opacity-70"
                }`}
              >
                Submit
              </button>
            </div>
          </form>

        </div>
      </main>
    </div>
  );
}