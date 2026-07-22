'use client';

import Link from 'next/link';

export default function SidebarOPS() {
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
          href="/profile?role=ops" 
          className="flex items-center px-3 py-3 rounded-2xl transition-colors cursor-pointer group hover:bg-amana-white hover:text-amana-blue"
        >
          <img src="/icon/PProfile.png" alt="Profile Icon" className="w-6 h-6 object-contain flex-shrink-0 group-hover:hidden" />
          <img src="/icon/BProfile.png" alt="Profile Icon Hover" className="w-6 h-6 object-contain flex-shrink-0 hidden group-hover:block" />
          <span className="font-medium text-base ml-3 whitespace-nowrap">Profile</span>
        </Link>

        {/* 2. Payment Approval */}
        <Link 
          href="/ops/payment-approval" 
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