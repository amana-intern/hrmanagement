'use client';

import Link from 'next/link';

export default function SidebarHR() {
  return (
    <div className="min-h-screen bg-amana-blue text-amana-white flex flex-col font-sans w-64 shadow-2xl flex-shrink-0 z-50 p-3">
      
      {/* Header / Logo AMANA */}
      <div className="pt-4 pb-4 flex flex-col items-center justify-center text-center w-full">
        
        {/* Bungkus dengan w-fit agar lebar elemen menyesuaikan teks terpanjang */}
        <div className="flex flex-col items-center w-fit">
          <h1 className="font-normal tracking-wide mb-1 text-amana-white text-5xl">
            AMANA
          </h1>
          <p className="font-semibold italic text-[10.5px] uppercase tracking-widest text-amana-white mb-4">
            Core Administrative System
          </p>

          {/* Garis Pemisah sekarang otomatis simetris ngikutin lebar teks */}
          <hr className="w-full border-t-[1.75px] border-amana-white/100" />
        </div>
      </div>

      {/* Menu List */}
      <nav className="flex-1 space-y-2">
        
        {/* 1. Profile */}
        <Link 
          href="/profile?role=hr" 
          className="flex items-center px-3 py-3 rounded-2xl transition-colors cursor-pointer group hover:bg-amana-white hover:text-amana-blue"
        >
          <img src="/icon/PProfile.png" alt="Profile Icon" className="w-6 h-6 object-contain flex-shrink-0 group-hover:hidden" />
          <img src="/icon/BProfile.png" alt="Profile Icon Hover" className="w-6 h-6 object-contain flex-shrink-0 hidden group-hover:block" />
          <span className="font-medium text-base ml-3 whitespace-nowrap">Profile</span>
        </Link>

        {/* 2. Group: Attendance */}
        <div className="group flex flex-col p-3 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-amana-white hover:text-amana-blue">
          <div className="flex items-center">
            <img src="/icon/PAttendance.png" alt="Attendance Icon" className="w-6 h-6 object-contain flex-shrink-0 group-hover:hidden" />
            <img src="/icon/BAttendance.png" alt="Attendance Icon Hover" className="w-6 h-6 object-contain flex-shrink-0 hidden group-hover:block" />
            <span className="font-medium text-base ml-3 whitespace-nowrap">Attendance</span>
          </div>

          <div className="grid transition-all duration-300 ease-in-out grid-rows-[0fr] group-hover:grid-rows-[1fr] opacity-0 group-hover:opacity-100">
            <div className="overflow-hidden">
              <div className="flex flex-col mt-3 pl-9 gap-1.5">
                <Link href="/hr/leave-approval" className="text-xs font-semibold py-2 px-3 rounded-xl text-amana-blue hover:bg-amana-blue hover:text-white transition-all block">
                  Leave Approval
                </Link>
                <Link href="/hr/medical-leave" className="text-xs font-semibold py-2 px-3 rounded-xl text-amana-blue hover:bg-amana-blue hover:text-white transition-all block">
                  Medical Leave
                </Link>
                <Link href="/hr/attendance-record" className="text-xs font-semibold py-2 px-3 rounded-xl text-amana-blue hover:bg-amana-blue hover:text-white transition-all block">
                  Record
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Group: Career Hub */}
        <div className="group flex flex-col p-3 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-amana-white hover:text-amana-blue">
          <div className="flex items-center">
            <img src="/icon/PCarrerHub.png" alt="Career Hub Icon" className="w-6 h-6 object-contain flex-shrink-0 group-hover:hidden" />
            <img src="/icon/BCarrerHub.png" alt="Career Hub Hover" className="w-6 h-6 object-contain flex-shrink-0 hidden group-hover:block" />
            <span className="font-medium text-base ml-3 whitespace-nowrap">Career Hub</span>
          </div>

          <div className="grid transition-all duration-300 ease-in-out grid-rows-[0fr] group-hover:grid-rows-[1fr] opacity-0 group-hover:opacity-100">
            <div className="overflow-hidden">
              <div className="flex flex-col mt-3 pl-9 gap-1.5">
                <Link href="/hr/contract-tracking" className="text-xs font-semibold py-2 px-3 rounded-xl text-amana-blue hover:bg-amana-blue hover:text-white transition-all block">
                  Contract Tracking
                </Link>
                <Link href="/hr/talent-roster" className="text-xs font-semibold py-2 px-3 rounded-xl text-amana-blue hover:bg-amana-blue hover:text-white transition-all block">
                  Talent Roster
                </Link>
                <Link href="/hr/job-listings" className="text-xs font-semibold py-2 px-3 rounded-xl text-amana-blue hover:bg-amana-blue hover:text-white transition-all block">
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