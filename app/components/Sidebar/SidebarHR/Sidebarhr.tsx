import Link from 'next/link';

export default function SidebarHR() {
  return (
    <div className="min-h-screen bg-[#185D87] text-[#F3F5F1] flex flex-col font-sans w-64 shadow-2xl flex-shrink-0 z-50">
      
      {/* Header / Logo */}
      <div className="pt-8 pb-10 flex flex-col items-center justify-center text-center px-4 min-h-[120px]">
        <h1 className="font-light tracking-wide mb-1 text-[#F3F5F1] text-4xl">
          AMANA
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-[#9EE1FF]">
          HR Portal
        </p>
      </div>

      {/* Menu List */}
      <nav className="flex-1 px-3 space-y-2 overflow-x-hidden">
        
        {/* 1. Profile */}
        <Link 
          href="/profile" 
          className="flex items-center px-3 py-3 rounded-xl transition-colors cursor-pointer group hover:bg-[#114566] hover:text-white active:bg-[#F3F5F1] active:text-[#185D87]"
        >
          <span className="text-2xl flex-shrink-0 w-8 text-center group-active:text-[#185D87]">👤</span>
          <span className="font-medium text-lg ml-3 whitespace-nowrap">Profile</span>
        </Link>

        {/* 2. Attendance (With Submenus) */}
        <div className="group flex flex-col py-3 px-3 rounded-xl cursor-pointer transition-colors duration-300 hover:bg-[#114566] hover:text-white active:bg-[#F3F5F1] active:text-[#185D87]">
          <div className="flex items-center">
            <span className="text-2xl flex-shrink-0 w-8 text-center group-active:text-[#185D87]">🕒</span>
            <span className="font-medium text-lg ml-3 whitespace-nowrap">Attendance</span>
          </div>

          <div className="grid transition-all duration-300 ease-in-out grid-rows-[0fr] group-hover:grid-rows-[1fr] opacity-0 group-hover:opacity-100">
            <div className="overflow-hidden">
              <div className="flex flex-col mt-4 pl-11 gap-3 pb-2 whitespace-normal">
                <Link href="/hr/leave-approval" className="text-xs font-bold text-[#9EE1FF] hover:text-white active:text-[#185D87] active:bg-[#F3F5F1] active:p-1 active:rounded transition-all block">
                  Leave Approval
                </Link>
                <Link href="/hr/medical-leave" className="text-xs font-bold text-[#9EE1FF] hover:text-white active:text-[#185D87] active:bg-[#F3F5F1] active:p-1 active:rounded transition-all block">
                  Medical Leave
                </Link>
                <Link href="/hr/attendance-record" className="text-xs font-bold text-[#9EE1FF] hover:text-white active:text-[#185D87] active:bg-[#F3F5F1] active:p-1 active:rounded transition-all block">
                  Record
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Career Hub (With Submenus) */}
        <div className="group flex flex-col py-3 px-3 rounded-xl cursor-pointer transition-colors duration-300 hover:bg-[#114566] hover:text-white active:bg-[#F3F5F1] active:text-[#185D87]">
          <div className="flex items-center">
            <span className="text-2xl flex-shrink-0 w-8 text-center group-active:text-[#185D87]">💼</span>
            <span className="font-medium text-lg ml-3 whitespace-nowrap">Career Hub</span>
          </div>

          <div className="grid transition-all duration-300 ease-in-out grid-rows-[0fr] group-hover:grid-rows-[1fr] opacity-0 group-hover:opacity-100">
            <div className="overflow-hidden">
              <div className="flex flex-col mt-4 pl-11 gap-3 pb-2 whitespace-normal">
                <Link href="/hr/contract-tracking" className="text-xs font-bold text-[#9EE1FF] hover:text-white active:text-[#185D87] active:bg-[#F3F5F1] active:p-1 active:rounded transition-all block">
                  Contract Tracking
                </Link>
                <Link href="/hr/talent-roster" className="text-xs font-bold text-[#9EE1FF] hover:text-white active:text-[#185D87] active:bg-[#F3F5F1] active:p-1 active:rounded transition-all block">
                  Talent Roster
                </Link>
                <Link href="/hr/job-listings" className="text-xs font-bold text-[#9EE1FF] hover:text-white active:text-[#185D87] active:bg-[#F3F5F1] active:p-1 active:rounded transition-all block">
                  Job Listings
                </Link>
              </div>
            </div>
          </div>
        </div>

      </nav>
    </div>
  );
}