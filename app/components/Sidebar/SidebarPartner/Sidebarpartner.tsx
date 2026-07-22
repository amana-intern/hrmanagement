'use client';

import Link from 'next/link';

export default function SidebarPartner() {
  return (
    <div className="min-h-screen bg-amana-blue text-amana-white flex flex-col font-sans w-64 shadow-2xl flex-shrink-0 z-50 p-3">
      
      {/* Header / Logo */}
      <div className="pt-6 pb-8 flex flex-col items-center justify-center text-center px-2">
        <h1 className="font-light tracking-wide mb-1 text-amana-white text-3xl">
          AMANA
        </h1>
        <p className="text-[9px] uppercase tracking-widest text-amana-sec-2">
          SuperAdmin Portal
        </p>
      </div>

      {/* Menu List */}
      <nav className="flex-1 space-y-2">
        
        {/* 1. Profile */}
        <Link 
          href="/profile?role=super" 
          className="flex items-center px-3 py-3 rounded-2xl transition-colors cursor-pointer group hover:bg-amana-white hover:text-amana-blue"
        >
          <img src="/icon/PProfile.png" alt="Profile Icon" className="w-6 h-6 object-contain flex-shrink-0 group-hover:hidden" />
          <img src="/icon/BProfile.png" alt="Profile Icon Hover" className="w-6 h-6 object-contain flex-shrink-0 hidden group-hover:block" />
          <span className="font-medium text-base ml-3 whitespace-nowrap">Profile</span>
        </Link>

        {/* 2. Leave Approval */}
        <Link 
          href="/superadmin/leave-approval" 
          className="flex items-center px-3 py-3 rounded-2xl transition-colors cursor-pointer group hover:bg-amana-white hover:text-amana-blue"
        >
          <img src="/icon/PAttendance.png" alt="Leave Icon" className="w-6 h-6 object-contain flex-shrink-0 group-hover:hidden" />
          <img src="/icon/BAttendance.png" alt="Leave Hover" className="w-6 h-6 object-contain flex-shrink-0 hidden group-hover:block" />
          <span className="font-medium text-base ml-3 whitespace-nowrap">Leave Approval</span>
        </Link>

        {/* 3. Contract Tracking */}
        <Link 
          href="/superadmin/contract-tracking" 
          className="flex items-center px-3 py-3 rounded-2xl transition-colors cursor-pointer group hover:bg-amana-white hover:text-amana-blue"
        >
          <img src="/icon/PCarrerHub.png" alt="Contract Icon" className="w-6 h-6 object-contain flex-shrink-0 group-hover:hidden" />
          <img src="/icon/BCarrerHub.png" alt="Contract Hover" className="w-6 h-6 object-contain flex-shrink-0 hidden group-hover:block" />
          <span className="font-medium text-base ml-3 whitespace-nowrap">Contract Tracking</span>
        </Link>

        {/* 4. Payment Approval */}
        <Link 
          href="/superadmin/payment-approval" 
          className="flex items-center px-3 py-3 rounded-2xl transition-colors cursor-pointer group hover:bg-amana-white hover:text-amana-blue"
        >
          <img src="/icon/PPayment.png" alt="Payment Icon" className="w-6 h-6 object-contain flex-shrink-0 group-hover:hidden" />
          <img src="/icon/BPayment.png" alt="Payment Hover" className="w-6 h-6 object-contain flex-shrink-0 hidden group-hover:block" />
          <span className="font-medium text-base ml-3 whitespace-nowrap">Payment Approval</span>
        </Link>

      </nav>
    </div>
  );
}