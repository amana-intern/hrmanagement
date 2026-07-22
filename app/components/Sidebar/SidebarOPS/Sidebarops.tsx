import Link from 'next/link';

export default function SidebarOPS() {
  return (
    <div className="min-h-screen bg-[#185D87] text-[#F3F5F1] flex flex-col font-sans w-64 shadow-2xl flex-shrink-0 z-50">
      
      {/* Header / Logo */}
      <div className="pt-8 pb-10 flex flex-col items-center justify-center text-center px-4 min-h-[120px]">
        <h1 className="font-light tracking-wide mb-1 text-[#F3F5F1] text-4xl">
          AMANA
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-[#9EE1FF]">
          OPS Portal
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

        {/* 2. Payment Approval */}
        <Link 
          href="/ops/payment-approval" 
          className="flex items-center px-3 py-3 rounded-xl transition-colors cursor-pointer group hover:bg-[#114566] hover:text-white active:bg-[#F3F5F1] active:text-[#185D87]"
        >
          <span className="text-2xl flex-shrink-0 w-8 text-center group-active:text-[#185D87]">💳</span>
          <span className="font-medium text-lg ml-3 whitespace-nowrap">Payment Approval</span>
        </Link>

      </nav>
    </div>
  );
}