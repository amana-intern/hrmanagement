"use client";

import { useState } from "react";
import SidebarUser from "../../../components/Sidebar/SidebarUser/Sidebaruser";

export default function LeaveRequestPage() {
  const [selectedLeave, setSelectedLeave] = useState<string>("");
  const [selectedSpecialLeave, setSelectedSpecialLeave] = useState<string>("");

  const specialLeaveList = [
    "Sakit karena haid (Maximum of 2 days)",
    "Menikah (Maximum of 3 days)",
    "Menikahkan anak (Maximum of 2 days)",
    "Mengkhitankan (Maximum of 2 days)",
    "Membaptis anak (Maximum of 2 days)",
    "Istri melahirkan (Maximum of 2 days)",
    "Salah satu anggota keluarga meninggal dunia (Maximum of 2 days)",
    "Anggota keluarga serumah meninggal dunia (Maximum of 1 day)",
    "Kewajiban negara (tergantung kebijakan perusahaan)",
    "Menunaikan ibadah haji (tergantung kebijakan perusahaan)",
    "Kecelakaan darurat (tergantung kebijakan perusahaan)"
  ];

  // Validasi: Tombol submit aktif jika leave sudah dipilih, 
  // dan jika Special Leave, rinciannya juga harus dipilih.
  const isFormValid = selectedLeave !== "" && (selectedLeave !== "Special Leave" || selectedSpecialLeave !== "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    alert("Leave Request berhasil disubmit!");
  };

  const inputClassName = "w-full px-4 py-2.5 bg-white border border-amana-sec-6 rounded-xl focus:border-amana-blue focus:ring-1 focus:ring-amana-blue outline-none text-sm font-normal transition-all text-amana-black shadow-xs";
  const labelClassName = "block text-sm font-semibold text-amana-black mb-1.5";

  return (
    <div className="flex w-full h-screen overflow-hidden bg-amana-white font-sans">
      <SidebarUser />

      {/* Main Content Area */}
      <main className="flex-1 p-6 text-amana-black flex flex-col items-center overflow-y-auto py-8 justify-start">
        <div className="w-full max-w-4xl flex flex-col gap-6">
          
          <h1 className="text-2xl md:text-3xl font-semibold text-amana-blue">
            Leave Request - User
          </h1>

          {/* Leave Balance Section (Diperbesar simetris memenuhi canvas) */}
          <div className="bg-white p-6 md:p-7 rounded-2xl border border-amana-sec-6 shadow-xs w-full">
            <h2 className="text-lg font-semibold text-amana-blue mb-4 border-b border-amana-sec-6 pb-2">Leave Balance</h2>
            <div className="grid grid-cols-3 gap-4 w-full">
              {[
                { count: "12", label: "Paid Leave" },
                { count: "0", label: "Special Leave" },
                { count: "0", label: "Unpaid Leave" }
              ].map((item, idx) => (
                <div key={idx} className="flex h-24 flex-col items-center justify-center border border-amana-sec-6 rounded-xl bg-amana-white w-full">
                  <span className="text-xl font-semibold text-amana-blue">{item.count}</span>
                  <span className="text-xs font-medium text-amana-sec-7 mt-1">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Request Leave Form Section */}
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-7 rounded-2xl border border-amana-sec-6 shadow-xs w-full flex flex-col gap-5">
            <h2 className="text-lg font-semibold text-amana-blue mb-1 border-b border-amana-sec-6 pb-2">Request Leave</h2>
            
            {/* Dropdown Leave Option Memanjang Penuh */}
            <div>
              <label className={labelClassName}>Leave Option</label>
              <select
                value={selectedLeave}
                onChange={(e) => {
                  setSelectedLeave(e.target.value);
                  if (e.target.value !== "Special Leave") setSelectedSpecialLeave("");
                }}
                className={`${inputClassName} appearance-none cursor-pointer`}
              >
                <option value="" disabled hidden>Click here to select your leave option...</option>
                <option value="Paid Leave">Paid Leave</option>
                <option value="Special Leave">Special Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>
            </div>

            {/* Animasi Dropdown untuk List Special Leave */}
            <div className={`grid transition-all duration-300 ease-in-out ${selectedLeave === "Special Leave" ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 overflow-hidden"}`}>
              <div className="overflow-hidden">
                <div className="border border-amana-sec-6 bg-amana-white p-5 rounded-xl text-sm flex flex-col gap-3">
                  <h3 className="font-semibold text-amana-blue text-sm border-b border-amana-sec-6 pb-2">
                    List Special Leave (Pilih salah satu)
                  </h3>
                  <ul className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto pr-2">
                    {specialLeaveList.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <input 
                          type="radio" 
                          name="specialLeaveType"
                          checked={selectedSpecialLeave === item}
                          onChange={() => setSelectedSpecialLeave(item)}
                          className="mt-1 accent-amana-blue cursor-pointer flex-shrink-0 scale-110" 
                        /> 
                        <span className="text-amana-black cursor-pointer leading-relaxed font-medium" onClick={() => setSelectedSpecialLeave(item)}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-amana-sec-6">
              <button
                type="submit"
                disabled={!isFormValid}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-xs ${
                  isFormValid
                    ? "bg-amana-blue text-white hover:bg-amana-sec-5 cursor-pointer"
                    : "bg-amana-sec-6 text-amana-sec-7 cursor-not-allowed opacity-60"
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