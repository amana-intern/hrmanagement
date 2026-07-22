'use client';

import { useState } from 'react';
import SidebarUser from '../../components/Sidebar/SidebarUser/Sidebaruser';

export default function PaymentPage() {
  // ================= STATE STEP 1 =================
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [practiceGroup, setPracticeGroup] = useState("");
  const [partner, setPartner] = useState("");
  const [paymentUnder, setPaymentUnder] = useState("");

  const isStep1Complete = role !== "" && practiceGroup !== "" && partner !== "" && paymentUnder !== "";

  // ================= STATE STEP 2 =================
  const [paymentFor, setPaymentFor] = useState("");

  // State Form Vendor
  const [vendorName, setVendorName] = useState("");
  const [vendorNpwp, setVendorNpwp] = useState("");
  const [vendorAmount, setVendorAmount] = useState("");
  const [vendorDueDate, setVendorDueDate] = useState("");

  // State Form Individual
  const [indActivity, setIndActivity] = useState("");
  const [indReceiver, setIndReceiver] = useState("");
  const [individualRole, setIndividualRole] = useState("");
  const [indOtherRole, setIndOtherRole] = useState("");
  const [indBankName, setIndBankName] = useState("");
  const [indAccNumber, setIndAccNumber] = useState("");
  const [indComponent, setIndComponent] = useState("");
  const [indAmount, setIndAmount] = useState("");

  // State Form Per Diem
  const [perDiemEvent, setPerDiemEvent] = useState("");
  const [perDiemParticipants, setPerDiemParticipants] = useState("");

  // State untuk nyimpen file yang di-upload per section
  const [files, setFiles] = useState<{ [key: string]: File | null }>({});

  const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [key]: file }));
    }
  };

  // Validasi Kelengkapan Berdasarkan Kategori Pembayaran
  const isVendorComplete = 
    vendorName.trim() !== "" && 
    vendorNpwp.trim() !== "" && 
    vendorAmount.trim() !== "" && 
    vendorDueDate.trim() !== "" && 
    files["vendor-invoice"] !== null && 
    files["vendor-invoice"] !== undefined;

  const isIndividualComplete = 
    indActivity.trim() !== "" && 
    indReceiver.trim() !== "" && 
    individualRole !== "" && 
    (individualRole !== "Other" || indOtherRole.trim() !== "") && 
    indBankName.trim() !== "" && 
    indAccNumber.trim() !== "" && 
    indComponent.trim() !== "" && 
    indAmount.trim() !== "" && 
    files["ind-ktp"] !== null && 
    files["ind-ktp"] !== undefined; 
    // Catatan: ind-invoice sengaja tidak dimasukkan karena bersifat optional!

  const isPerDiemComplete = 
    perDiemEvent.trim() !== "" && 
    perDiemParticipants.trim() !== "" && 
    files["perdiem-file"] !== null && 
    files["perdiem-file"] !== undefined;

  // Styling umum input
  const inputClassName = "w-full px-4 py-2.5 bg-white border border-amana-sec-6 rounded-xl focus:border-amana-blue focus:ring-1 focus:ring-amana-blue outline-none text-sm font-normal transition-all text-amana-black shadow-xs";
  const labelClassName = "block text-sm font-semibold text-amana-black mb-1.5";

  const preventInvalidNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e') {
      e.preventDefault();
    }
  };

  // Komponen Upload Box
  const UploadBox = ({ label, fileKey }: { label?: string; fileKey: string }) => (
    <div className="relative w-full border border-amana-sec-6 rounded-xl p-6 flex flex-col items-center justify-center bg-white hover:bg-amana-sec-2/10 transition cursor-pointer mt-1 shadow-xs">
      <input 
        type="file" 
        accept="application/pdf"
        onChange={(e) => handleFileChange(fileKey, e)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
      />
      <svg className="w-6 h-6 text-amana-blue mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 12v9m0-9l-3 3m3-3l3 3" />
      </svg>
      <span className="text-[11px] font-semibold text-amana-blue uppercase tracking-wider text-center truncate max-w-full px-2">
        {files[fileKey] ? files[fileKey]?.name : (label || "UPLOAD INVOICE DOCUMENT (.PDF)")}
      </span>
    </div>
  );

  return (
    <div className="flex w-full h-screen overflow-hidden bg-amana-white font-sans">
      
      <SidebarUser />

      {/* Main Content Area */}
      <main className={`flex-1 p-6 text-amana-black flex flex-col items-center justify-center ${step === 2 ? 'overflow-y-auto py-8 justify-start' : 'overflow-hidden'}`}>
        
        <div className="w-full max-w-3xl flex flex-col">
          
          <h1 className="text-2xl md:text-3xl font-semibold mb-4 text-amana-blue">
            Payment Submission
          </h1>

          <div className="bg-white p-6 md:p-7 rounded-2xl border border-amana-sec-6 shadow-xs w-full flex flex-col gap-4">
            
            {/* ======================= STEP 1 ======================= */}
            {step === 1 && (
              <>
                <h2 className="text-lg font-semibold text-amana-blue mb-1 border-b border-amana-sec-6 pb-2">Step 1: General Details</h2>
                
                <div>
                  <label className={labelClassName}>Submitting as</label>
                  <select 
                    value={role} onChange={(e) => setRole(e.target.value)}
                    className={`${inputClassName} appearance-none cursor-pointer`}
                  >
                    <option value="" disabled hidden>Click here to select your role...</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Project Manager">Project Manager</option>
                  </select>
                </div>

                <div>
                  <label className={labelClassName}>Practice Group</label>
                  <select 
                    value={practiceGroup} onChange={(e) => setPracticeGroup(e.target.value)}
                    className={`${inputClassName} appearance-none cursor-pointer`}
                  >
                    <option value="" disabled hidden>Click here to select practice group...</option>
                    <option value="Education">Education</option>
                    <option value="Digital">Digital</option>
                    <option value="Strategy and Transformation">Strategy and Transformation</option>
                    <option value="Health and Wellbeing">Health and Wellbeing</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className={labelClassName}>Related Partner</label>
                  <select 
                    value={partner} onChange={(e) => setPartner(e.target.value)}
                    className={`${inputClassName} appearance-none cursor-pointer`}
                  >
                    <option value="" disabled hidden>Click here to select related partner...</option>
                    <option value="Nya' Zata Amani">Nya' Zata Amani (Education / Health)</option>
                    <option value="Prasetya Dwicahya">Prasetya Dwicahya (Strategy &amp; Transformation)</option>
                    <option value="Endiyan Rakhmanda">Endiyan Rakhmanda (Digital)</option>
                    <option value="Kevin Tan">Kevin Tan (Operationals)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClassName}>Payment Under</label>
                  <select 
                    value={paymentUnder} onChange={(e) => setPaymentUnder(e.target.value)}
                    className={`${inputClassName} appearance-none cursor-pointer`}
                  >
                    <option value="" disabled hidden>Click here to select payment under...</option>
                    <option value="PT Janji Cahaya Kembar">PT Janji Cahaya Kembar</option>
                    <option value="Yayasan Mitra Cahaya Amanah">Yayasan Mitra Cahaya Amanah</option>
                  </select>
                </div>

                <div className="flex justify-end mt-2 pt-3 border-t border-amana-sec-6">
                  <button 
                    type="button" 
                    disabled={!isStep1Complete}
                    onClick={() => setStep(2)}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs
                      ${isStep1Complete 
                        ? "bg-amana-blue hover:bg-amana-sec-5 text-white cursor-pointer" 
                        : "bg-amana-sec-6 text-amana-sec-7 cursor-not-allowed"
                      }`}
                  >
                    Next Step
                  </button>
                </div>
              </>
            )}


            {/* ======================= STEP 2 ======================= */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-3 mb-1 border-b border-amana-sec-6 pb-3">
                  <button 
                    onClick={() => setStep(1)} 
                    className="text-amana-sec-7 hover:text-amana-blue transition flex items-center justify-center p-1"
                    title="Back to Step 1"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-lg font-semibold text-amana-blue">Step 2: Payment Details</h2>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-amana-blue mb-2">To whom is this payment for</label>
                  <select 
                    value={paymentFor} 
                    onChange={(e) => {
                      setPaymentFor(e.target.value);
                      setIndividualRole(""); 
                    }}
                    className={`${inputClassName} appearance-none cursor-pointer font-semibold`}
                  >
                    <option value="" disabled hidden>Select Payment Type...</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Individual(s)">Individual(s)</option>
                    <option value="Per Diem">Per Diem</option>
                  </select>
                </div>

                {/* ================= KONDISI 1: VENDOR ================= */}
                {paymentFor === "Vendor" && (
                  <div className="flex flex-col gap-4 animate-fade-in mt-2">
                    <div>
                      <label className={labelClassName}>Vendor Name</label>
                      <input 
                        type="text" 
                        value={vendorName} 
                        onChange={(e) => setVendorName(e.target.value)} 
                        placeholder="Enter vendor name" 
                        className={inputClassName} 
                      />
                    </div>
                    
                    <div>
                      <label className={labelClassName}>NPWP Vendor</label>
                      <input 
                        type="number" 
                        min="0"
                        value={vendorNpwp}
                        onChange={(e) => setVendorNpwp(e.target.value)}
                        onKeyDown={preventInvalidNumberInput}
                        placeholder="Enter NPWP" 
                        className={inputClassName} 
                      />
                    </div>
                    
                    <div>
                      <label className={labelClassName}>Payment Amount</label>
                      <input 
                        type="number" 
                        min="0"
                        value={vendorAmount}
                        onChange={(e) => setVendorAmount(e.target.value)}
                        onKeyDown={preventInvalidNumberInput}
                        placeholder="e.g. 1500000" 
                        className={inputClassName} 
                      />
                    </div>
                    
                    <div>
                      <label className={labelClassName}>Due Date</label>
                      <input 
                        type="date" 
                        value={vendorDueDate}
                        onChange={(e) => setVendorDueDate(e.target.value)}
                        className={`${inputClassName} cursor-pointer`} 
                      />
                    </div>
                    
                    <div>
                      <label className={labelClassName}>Attach Invoice</label>
                      <UploadBox label="UPLOAD INVOICE DOCUMENT (.PDF)" fileKey="vendor-invoice" />
                    </div>
                    
                    <div className="flex justify-end mt-2 pt-3">
                      <button 
                        type="button" 
                        disabled={!isVendorComplete}
                        className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-xs
                          ${isVendorComplete 
                            ? "bg-amana-blue hover:bg-amana-sec-5 text-white cursor-pointer" 
                            : "bg-amana-sec-6 text-amana-sec-7 cursor-not-allowed"
                          }`}
                      >
                        Submit Payment
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= KONDISI 2: INDIVIDUAL(S) ================= */}
                {paymentFor === "Individual(s)" && (
                  <div className="flex flex-col gap-4 animate-fade-in mt-2">
                    <div>
                      <label className={labelClassName}>Name of Activity</label>
                      <input 
                        type="text" 
                        value={indActivity}
                        onChange={(e) => setIndActivity(e.target.value)}
                        placeholder="Activity name" 
                        className={inputClassName} 
                      />
                    </div>
                    
                    <div>
                      <label className={labelClassName}>Name of the Honor Receiver</label>
                      <input 
                        type="text" 
                        value={indReceiver}
                        onChange={(e) => setIndReceiver(e.target.value)}
                        placeholder="Receiver name" 
                        className={inputClassName} 
                      />
                    </div>
                    
                    <div>
                      <label className={labelClassName}>Their role in this event</label>
                      <select 
                        value={individualRole} 
                        onChange={(e) => setIndividualRole(e.target.value)}
                        className={`${inputClassName} appearance-none cursor-pointer`}
                      >
                        <option value="" disabled hidden>Select role...</option>
                        <option value="Speaker">Speaker</option>
                        <option value="Moderator">Moderator</option>
                        <option value="Language Interpreter">Language Interpreter</option>
                        <option value="Other">Other (specify)</option>
                      </select>
                      {individualRole === "Other" && (
                        <input 
                          type="text" 
                          value={indOtherRole}
                          onChange={(e) => setIndOtherRole(e.target.value)}
                          placeholder="Please specify role..." 
                          className={`${inputClassName} mt-2`} 
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClassName}>Bank Account Name</label>
                        <input 
                          type="text" 
                          value={indBankName}
                          onChange={(e) => setIndBankName(e.target.value)}
                          placeholder="Account Name" 
                          className={inputClassName} 
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Bank Account Number</label>
                        <input 
                          type="number" 
                          min="0"
                          value={indAccNumber}
                          onChange={(e) => setIndAccNumber(e.target.value)}
                          onKeyDown={preventInvalidNumberInput}
                          placeholder="Account Number" 
                          className={inputClassName} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClassName}>Honor Components</label>
                        <input 
                          type="text" 
                          value={indComponent}
                          onChange={(e) => setIndComponent(e.target.value)}
                          placeholder="Component" 
                          className={inputClassName} 
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Amount</label>
                        <input 
                          type="number" 
                          min="0"
                          value={indAmount}
                          onChange={(e) => setIndAmount(e.target.value)}
                          onKeyDown={preventInvalidNumberInput}
                          placeholder="Rp" 
                          className={inputClassName} 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className={labelClassName}>
                        Copy of Individual KTP <span className="font-light text-amana-sec-7 ml-1">(For tax purposes)</span>
                      </label>
                      <UploadBox label="UPLOAD KTP DOCUMENT (.PDF)" fileKey="ind-ktp" />
                    </div>
                    
                    <div>
                      <label className={labelClassName}>
                        Attach Invoice <span className="font-light text-amana-sec-7 ml-1">(Optional)</span>
                      </label>
                      <UploadBox label="UPLOAD INVOICE DOCUMENT (.PDF)" fileKey="ind-invoice" />
                    </div>
                    
                    <div className="flex justify-end mt-2 pt-3">
                      <button 
                        type="button" 
                        disabled={!isIndividualComplete}
                        className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-xs
                          ${isIndividualComplete 
                            ? "bg-amana-blue hover:bg-amana-sec-5 text-white cursor-pointer" 
                            : "bg-amana-sec-6 text-amana-sec-7 cursor-not-allowed"
                          }`}
                      >
                        Submit Payment
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= KONDISI 3: PER DIEM ================= */}
                {paymentFor === "Per Diem" && (
                  <div className="flex flex-col gap-4 animate-fade-in mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClassName}>Name of Event</label>
                        <input 
                          type="text" 
                          value={perDiemEvent}
                          onChange={(e) => setPerDiemEvent(e.target.value)}
                          placeholder="Event Name" 
                          className={inputClassName} 
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Number of Participants</label>
                        <input 
                          type="number" 
                          min="0"
                          value={perDiemParticipants}
                          onChange={(e) => setPerDiemParticipants(e.target.value)}
                          onKeyDown={preventInvalidNumberInput}
                          placeholder="E.g. 50" 
                          className={inputClassName} 
                        />
                      </div>
                    </div>
                    
                    <div className="mt-1 bg-amana-white rounded-xl p-4 border border-amana-sec-6">
                      <h3 className="text-base font-semibold text-amana-blue mb-2">Upload file with participant details</h3>
                      <p className="text-xs text-amana-sec-7-5 mb-3 font-normal">Please ensure the document includes:</p>
                      <div className="grid grid-cols-2 gap-y-1 text-xs text-amana-black font-semibold mb-4">
                        <p>1. Full Name</p>
                        <p>2. Phone Number</p>
                        <p>3. Organization</p>
                        <p>4. Bank Account Name</p>
                        <p>5. Bank Account Number</p>
                        <p>6. Amount</p>
                      </div>
                      
                      <img 
                        src="/perdiem.png" 
                        alt="Format Example" 
                        className="w-full rounded-lg border border-amana-sec-6 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className={labelClassName}>Upload The File Here</label>
                      <UploadBox label="UPLOAD PARTICIPANT LIST (.PDF)" fileKey="perdiem-file" />
                    </div>
                    
                    <div className="flex justify-end mt-2 pt-3">
                      <button 
                        type="button" 
                        disabled={!isPerDiemComplete}
                        className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-xs
                          ${isPerDiemComplete 
                            ? "bg-amana-blue hover:bg-amana-sec-5 text-white cursor-pointer" 
                            : "bg-amana-sec-6 text-amana-sec-7 cursor-not-allowed"
                          }`}
                      >
                        Submit Payment
                      </button>
                    </div>
                  </div>
                )}

              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}