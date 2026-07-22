"use client";

import { useState } from "react";
import SidebarUser from "../../../components/Sidebar/SidebarUser/Sidebaruser";

export default function LeaveRequestPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<string | null>(null);
  const [selectedSpecialLeave, setSelectedSpecialLeave] = useState<string | null>(null);

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
            <div className="flex gap-6">
              {[
                { count: "12", label: "Paid Leave" },
                { count: "0", label: "Special Leave" },
                { count: "0", label: "Unpaid Leave" }
              ].map((item, idx) => (
                <div key={idx} className="flex h-24 w-40 flex-col items-center justify-center border border-amana-sec-6 rounded-xl bg-amana-white">
                  <span className="text-xl font-semibold text-amana-blue">{item.count}</span>
                  <span className="text-sm text-amana-sec-7">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Request Leave Form Section */}
          <div className="bg-white p-6 rounded-2xl border border-amana-sec-6 shadow-xs flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-amana-blue">Request Leave</h2>
            
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex w-full items-center justify-between border border-amana-sec-6 px-4 py-3 rounded-xl text-left text-amana-blue focus:outline-none md:w-1/2 bg-amana-white font-medium text-sm"
            >
              <span>{selectedLeave || "Leave Option (Dropdown Table)"}</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="flex h-fit w-fit flex-col gap-3 border border-amana-sec-6 p-4 rounded-xl bg-amana-white">
                  {["Paid Leave", "Special Leave", "Unpaid Leave"].map((type, idx) => (
                    <label key={idx} className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                      <input
                        type="radio"
                        name="leaveType"
                        onChange={() => {
                          setSelectedLeave(type);
                          if (type !== "Special Leave") setSelectedSpecialLeave(null);
                        }}
                        className="accent-amana-blue"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>

                {selectedLeave === "Special Leave" && (
                  <div className="max-w-md border border-amana-sec-6 bg-amana-white p-4 rounded-xl text-sm">
                    <h3 className="mb-2 font-semibold text-amana-blue">List Special Leave (Pilih salah satu)</h3>
                    <ul className="flex flex-col gap-2">
                      {specialLeaveList.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <input 
                            type="radio" 
                            name="specialLeaveType"
                            checked={selectedSpecialLeave === item}
                            onChange={() => setSelectedSpecialLeave(item)}
                            className="mt-1 accent-amana-blue cursor-pointer" 
                          /> 
                          <span className="text-amana-black cursor-pointer" onClick={() => setSelectedSpecialLeave(item)}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tombol Submit diposisikan rapi di bawah dengan flexbox (tidak menumpuk garis) */}
            <div className="flex justify-end pt-2">
              <button className="px-8 py-2.5 bg-amana-blue text-white rounded-xl hover:bg-amana-sec-5 font-semibold text-sm transition shadow-xs">
                Submit
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}