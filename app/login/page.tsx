'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter untuk pindah halaman

export default function LoginPage() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const router = useRouter(); // Panggil router

  return (
    <div className="min-h-screen bg-[url('/backlogin.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 font-sans relative">
      
      {/* Overlay hitam transparan agar form login tetap pop-out */}
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      {/* Container form utama dengan z-10 agar berada di atas overlay */}
      <div className="relative z-10 overflow-hidden w-full max-w-[768px] min-h-[480px] bg-white rounded-[30px] shadow-2xl">

        {/* Sign Up Panel */}
        <div className={`absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out flex items-center justify-center px-10 bg-white ${isRightPanelActive ? 'translate-x-full opacity-100 z-50' : 'opacity-0 z-10 pointer-events-none'}`}>
          <form className="flex flex-col items-center justify-center w-full h-full text-center">
            <h1 className="text-3xl font-bold mb-2 text-[#185D87]">Create Account</h1>
            <span className="text-xs text-gray-500 mb-6">Register your AMANA account</span>
            
            <input type="text" placeholder="Name" className="w-full bg-[#F3F5F1] text-[#185D87] border-none my-2 p-3 text-sm rounded-lg outline-none focus:ring-2 focus:ring-[#9EE1FF]" />
            <input type="email" placeholder="Enter E-mail" className="w-full bg-[#F3F5F1] text-[#185D87] border-none my-2 p-3 text-sm rounded-lg outline-none focus:ring-2 focus:ring-[#9EE1FF]" />
            <input type="password" placeholder="Enter Password" className="w-full bg-[#F3F5F1] text-[#185D87] border-none my-2 p-3 text-sm rounded-lg outline-none focus:ring-2 focus:ring-[#9EE1FF]" />
            
            <button type="button" className="bg-[#185D87] text-[#F3F5F1] text-xs font-bold py-3 px-11 rounded-lg uppercase tracking-wider mt-6 hover:scale-105 transition-transform shadow-md">
              Sign Up
            </button>
          </form>
        </div>

        {/* Sign In Panel */}
        <div className={`absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out flex items-center justify-center px-10 bg-white ${isRightPanelActive ? 'translate-x-full opacity-0 z-10 pointer-events-none' : 'z-20 opacity-100'}`}>
          <form className="flex flex-col items-center justify-center w-full h-full text-center">
            <img src="/AMANA_Logo.png" className="h-10 mb-4 object-contain" alt="Amana Logo" />
            <h1 className="text-3xl font-bold mb-2 text-[#185D87]">Sign In</h1>
            <span className="text-xs text-gray-500 mb-6">Sign in with Email & Password</span>
            
            <input type="email" placeholder="Enter E-mail" className="w-full bg-[#F3F5F1] text-[#185D87] border-none my-2 p-3 text-sm rounded-lg outline-none focus:ring-2 focus:ring-[#9EE1FF]" />
            <input type="password" placeholder="Enter Password" className="w-full bg-[#F3F5F1] text-[#185D87] border-none my-2 p-3 text-sm rounded-lg outline-none focus:ring-2 focus:ring-[#9EE1FF]" />
            
            <a href="#" className="text-[#185D87] text-xs mt-3 mb-4 hover:underline font-medium">Forget Password?</a>
            
            {/* Tombol Sign In dengan onClick router.push */}
            <button 
              type="button" 
              onClick={() => router.push('/profile')}
              className="bg-[#185D87] text-[#F3F5F1] text-xs font-bold py-3 px-11 rounded-lg uppercase tracking-wider hover:scale-105 transition-transform shadow-md"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Toggle Container */}
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-[100] ${isRightPanelActive ? '-translate-x-full' : ''}`}>
          <div className={`bg-[#185D87] relative -left-full h-full w-[200%] transition-transform duration-700 ease-in-out text-[#F3F5F1] ${isRightPanelActive ? 'translate-x-1/2' : 'translate-x-0'}`}>
            <div className={`absolute w-1/2 h-full flex flex-col items-center justify-center px-10 text-center top-0 transition-transform duration-700 ease-in-out ${isRightPanelActive ? 'translate-x-0' : '-translate-x-[200%]'}`}>
              <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
              <p className="text-sm leading-relaxed mb-8 px-2 font-light">To keep connected with AMANA, please login with your personal info</p>
              <button type="button" onClick={() => setIsRightPanelActive(false)} className="bg-transparent border-2 border-[#F3F5F1] text-[#F3F5F1] text-xs font-bold py-3 px-11 rounded-lg uppercase tracking-wider hover:bg-[#F3F5F1] hover:text-[#185D87] transition-colors">
                Sign In
              </button>
            </div>
            <div className={`absolute right-0 w-1/2 h-full flex flex-col items-center justify-center px-10 text-center top-0 transition-transform duration-700 ease-in-out ${isRightPanelActive ? 'translate-x-[200%]' : 'translate-x-0'}`}>
              <h1 className="text-3xl font-bold mb-4">Hello, Talent!</h1>
              <p className="text-sm leading-relaxed mb-8 px-2 font-light">Enter your personal details and start your journey with AMANA Core Administrative System</p>
              <button type="button" onClick={() => setIsRightPanelActive(true)} className="bg-transparent border-2 border-[#F3F5F1] text-[#F3F5F1] text-xs font-bold py-3 px-11 rounded-lg uppercase tracking-wider hover:bg-[#F3F5F1] hover:text-[#185D87] transition-colors">
                Sign Up
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
} 