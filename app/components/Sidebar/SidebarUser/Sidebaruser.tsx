'use client';

import Link from 'next/link';

export default function SidebarUser() {
  return (
    <div className="min-h-screen bg-amana-blue text-amana-white flex flex-col font-sans w-64 shadow-2xl flex-shrink-0 z-50 p-3">
      
      {/* Header / Logo AMANA */}
      <div className="pt-6 pb-8 flex flex-col items-center justify-center text-center px-2">
        <h1 className="font-light tracking-wide mb-1 text-amana-white text-3xl">
          AMANA
        </h1>
        <p className="text-[9px] uppercase tracking-widest text-amana-sec-2">
          Core Administrative System
        </p>
      </div>

      {/* Menu List */}
      <nav className="flex-1 space-y-2">
        
        {/* 1. Profile */}
        <Link 
          href="/profile" 
          className="flex items-center px-3 py-3 rounded-2xl transition-colors cursor-pointer group hover:bg-amana-white hover:text-amana-blue"
        >
          <img 
            src="/icon/PProfile.png" 
            alt="Profile Icon" 
            className="w-6 h-6 object-contain flex-shrink-0 group-hover:hidden" 
          />
          <img 
            src="/icon/BProfile.png" 
            alt="Profile Icon Hover" 
            className="w-6 h-6 object-contain flex-shrink-0 hidden group-hover:block" 
          />
          <span className="font-medium text-base ml-3 whitespace-nowrap">
            Profile
          </span>
        </Link>

        {/* 2. Group: Attendance (Card Style on Hover) */}
        <div className="group flex flex-col p-3 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-amana-white hover:text-amana-blue">
          
          <div className="flex items-center">
            <img 
              src="/icon/PAttendance.png" 
              alt="Attendance Icon" 
              className="w-6 h-6 object-contain flex-shrink-0 group-hover:hidden" 
            />
            <img 
              src="/icon/BAttendance.png" 
              alt="Attendance Icon Hover" 
              className="w-6 h-6 object-contain flex-shrink-0 hidden group-hover:block" 
            />
            <span className="font-medium text-base ml-3 whitespace-nowrap">
              Attendance
            </span>
          </div>

          {/* Sub-menu yang muncul berbentuk kartu di dalam hover */}
          <div className="grid transition-all duration-300 ease-in-out grid-rows-[0fr] group-hover:grid-rows-[1fr] opacity-0 group-hover:opacity-100">
            <div className="overflow-hidden">
              <div className="flex flex-col mt-3 pl-9 gap-1.5">
                <Link 
                  href="/request-leave" 
                  className="text-xs font-semibold py-2 px-3 rounded-xl text-amana-blue hover:bg-amana-blue hover:text-white transition-all block"
                >
                  Leave Approval
                </Link>
                <Link 
                  href="/attendance-leaves" 
                  className="text-xs font-semibold py-2 px-3 rounded-xl text-amana-blue hover:bg-amana-blue hover:text-white transition-all block"
                >
                  Attendance & Leaves
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Payment */}
        <Link 
          href="/payment" 
          className="flex items-center px-3 py-3 rounded-2xl transition-colors cursor-pointer group hover:bg-amana-white hover:text-amana-blue"
        >
          <img 
            src="/icon/PPayment.png" 
            alt="Payment Icon" 
            className="w-6 h-6 object-contain flex-shrink-0 group-hover:hidden" 
          />
          <img 
            src="/icon/BPayment.png" 
            alt="Payment Icon Hover" 
            className="w-6 h-6 object-contain flex-shrink-0 hidden group-hover:block" 
          />
          <span className="font-medium text-base ml-3 whitespace-nowrap">
            Payment
          </span>
        </Link>

        {/* 4. Career Hub */}
        <Link 
          href="/career-hub" 
          className="flex items-center px-3 py-3 rounded-2xl transition-colors cursor-pointer group hover:bg-amana-white hover:text-amana-blue"
        >
          <img 
            src="/icon/PCarrerHub.png" 
            alt="Career Hub Icon" 
            className="w-6 h-6 object-contain flex-shrink-0 group-hover:hidden" 
          />
          <img 
            src="/icon/BCarrerHub.png" 
            alt="Career Hub Icon Hover" 
            className="w-6 h-6 object-contain flex-shrink-0 hidden group-hover:block" 
          />
          <span className="font-medium text-base ml-3 whitespace-nowrap">
            Career Hub
          </span>
        </Link>

      </nav>
    </div>
  );
}