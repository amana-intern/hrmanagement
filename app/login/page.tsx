'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[url('/backlogin.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 font-sans relative">
      <div className="absolute inset-0 bg-black/40 z-0 backdrop-blur-[2px]" />

      <div className="relative z-10 overflow-hidden w-full max-w-[768px] min-h-[480px] bg-white/95 backdrop-blur-sm rounded-[30px] shadow-2xl animate-scale-in">

        <div className={`absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out flex items-center justify-center px-10 bg-white/95 backdrop-blur-sm ${isRightPanelActive ? 'translate-x-full opacity-100 z-50' : 'opacity-0 z-10 pointer-events-none'}`}>
          <form className="flex flex-col items-center justify-center w-full h-full text-center">
            <h1 className="text-3xl font-bold mb-2 text-amana-blue">Create Account</h1>
            <span className="text-xs text-amana-sec-7 mb-6">Register your AMANA account</span>

            <input type="text" placeholder="Name" className="w-full bg-amana-white text-amana-black border border-amana-sec-6 my-2 p-3 text-sm rounded-xl outline-none focus:border-amana-blue focus:ring-2 focus:ring-amana-blue/15 transition-all" />
            <input type="email" placeholder="Enter E-mail" className="w-full bg-amana-white text-amana-black border border-amana-sec-6 my-2 p-3 text-sm rounded-xl outline-none focus:border-amana-blue focus:ring-2 focus:ring-amana-blue/15 transition-all" />
            <input type="password" placeholder="Enter Password" className="w-full bg-amana-white text-amana-black border border-amana-sec-6 my-2 p-3 text-sm rounded-xl outline-none focus:border-amana-blue focus:ring-2 focus:ring-amana-blue/15 transition-all" />

            <button type="button" className="bg-amana-blue text-amana-white text-xs font-bold py-3 px-11 rounded-xl uppercase tracking-wider mt-6 hover:shadow-lg hover:shadow-amana-blue/30 hover:-translate-y-0.5 transition-all duration-200 shadow-md">
              Sign Up
            </button>
          </form>
        </div>

        <div className={`absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out flex items-center justify-center px-10 bg-white/95 backdrop-blur-sm ${isRightPanelActive ? 'translate-x-full opacity-0 z-10 pointer-events-none' : 'z-20 opacity-100'}`}>
          <form className="flex flex-col items-center justify-center w-full h-full text-center">
            <img src="/AMANA_Logo.png" className="h-10 mb-4 object-contain" alt="Amana Logo" />
            <h1 className="text-3xl font-bold mb-2 text-amana-blue">Sign In</h1>
            <span className="text-xs text-amana-sec-7 mb-6">Sign in with Email & Password</span>

            <input type="email" placeholder="Enter E-mail" className="w-full bg-amana-white text-amana-black border border-amana-sec-6 my-2 p-3 text-sm rounded-xl outline-none focus:border-amana-blue focus:ring-2 focus:ring-amana-blue/15 transition-all" />
            <input type="password" placeholder="Enter Password" className="w-full bg-amana-white text-amana-black border border-amana-sec-6 my-2 p-3 text-sm rounded-xl outline-none focus:border-amana-blue focus:ring-2 focus:ring-amana-blue/15 transition-all" />

            <button type="button" className="text-amana-blue text-xs mt-3 mb-4 hover:underline font-medium bg-transparent border-none cursor-pointer">Forget Password?</button>

            <button
              type="button"
              onClick={() => router.push('/user/profile')}
              className="bg-amana-blue text-amana-white text-xs font-bold py-3 px-11 rounded-xl uppercase tracking-wider hover:shadow-lg hover:shadow-amana-blue/30 hover:-translate-y-0.5 transition-all duration-200 shadow-md"
            >
              Sign In
            </button>
          </form>
        </div>

        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-[100] ${isRightPanelActive ? '-translate-x-full' : ''}`}>
          <div className={`bg-gradient-to-br from-amana-blue to-amana-sec-5 relative -left-full h-full w-[200%] transition-transform duration-700 ease-in-out text-amana-white ${isRightPanelActive ? 'translate-x-1/2' : 'translate-x-0'}`}>
            <div className={`absolute w-1/2 h-full flex flex-col items-center justify-center px-10 text-center top-0 transition-transform duration-700 ease-in-out ${isRightPanelActive ? 'translate-x-0' : '-translate-x-[200%]'}`}>
              <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
              <p className="text-sm leading-relaxed mb-8 px-2 font-light text-amana-white/80">To keep connected with AMANA, please login with your personal info</p>
              <button type="button" onClick={() => setIsRightPanelActive(false)} className="bg-transparent border-2 border-amana-white text-amana-white text-xs font-bold py-3 px-11 rounded-xl uppercase tracking-wider hover:bg-amana-white hover:text-amana-blue transition-all duration-200">
                Sign In
              </button>
            </div>
            <div className={`absolute right-0 w-1/2 h-full flex flex-col items-center justify-center px-10 text-center top-0 transition-transform duration-700 ease-in-out ${isRightPanelActive ? 'translate-x-[200%]' : 'translate-x-0'}`}>
              <h1 className="text-3xl font-bold mb-4">Hello, Talent!</h1>
              <p className="text-sm leading-relaxed mb-8 px-2 font-light text-amana-white/80">Enter your personal details and start your journey with AMANA Core Administrative System</p>
              <button type="button" onClick={() => setIsRightPanelActive(true)} className="bg-transparent border-2 border-amana-white text-amana-white text-xs font-bold py-3 px-11 rounded-xl uppercase tracking-wider hover:bg-amana-white hover:text-amana-blue transition-all duration-200">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
