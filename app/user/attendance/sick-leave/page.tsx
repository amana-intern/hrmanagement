import SidebarUser from "../../../components/Sidebar/SidebarUser/Sidebaruser";

export default function SickLeavePage() {
  return (
    <div className="flex min-h-screen bg-amana-white font-sans text-amana-black">
      <SidebarUser />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto flex flex-col gap-8 w-full">
          
          <h1 className="text-3xl font-semibold text-amana-blue">
            Sick Leave - User
          </h1>

          {/* Form Date Section */}
          <div className="bg-white p-6 rounded-2xl border border-amana-sec-6 shadow-xs">
            <h2 className="text-xl font-semibold mb-4 text-amana-blue">Sick Leave Schedule</h2>
            <div className="flex flex-col gap-4 max-w-xl">
              <input
                type="text"
                placeholder="When are you leaving? (DATE: DD/MM/YY)"
                className="w-full border border-amana-sec-6 px-4 py-3 rounded-xl text-amana-blue placeholder-amana-blue/50 focus:outline-none focus:ring-2 focus:ring-amana-blue text-sm bg-amana-white"
              />
              <input
                type="text"
                placeholder="When will you be back? (DATE: DD/MM/YY)"
                className="w-full border border-amana-sec-6 px-4 py-3 rounded-xl text-amana-blue placeholder-amana-blue/50 focus:outline-none focus:ring-2 focus:ring-amana-blue text-sm bg-amana-white"
              />
            </div>
          </div>

          {/* Upload Medical Certificate Section */}
          <div className="bg-white p-6 rounded-2xl border border-amana-sec-6 shadow-xs flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-amana-blue">Upload Medical Certificate</h2>
            
            <div className="flex h-44 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-amana-sec-6 rounded-2xl bg-amana-white hover:bg-white transition">
              <svg className="mb-2 h-10 w-10 text-amana-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm font-semibold text-amana-blue">
                Drag Images/PDF
              </span>
              <span className="text-xs text-amana-sec-7 mt-1 font-light">Format PDF / Image (Max 5MB)</span>
            </div>

            {/* Tombol Submit diposisikan rapi di bawah dengan flexbox */}
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