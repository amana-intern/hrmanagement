'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, OutlineButton } from '../components/ui';

export default function LoginPage() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[url('/backlogin.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 font-sans relative">
      <div className="absolute inset-0 bg-black/40 z-0 backdrop-blur-[2px]" />

      <div className="relative z-10 overflow-hidden w-full max-w-[768px] min-h-[480px] bg-white/95 backdrop-blur-sm rounded-[30px] shadow-2xl">

        <div className={`absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out flex items-center justify-center px-10 bg-white/95 backdrop-blur-sm ${isRightPanelActive ? 'translate-x-full opacity-100 z-50' : 'opacity-0 z-10 pointer-events-none'}`}>
          <form className="flex flex-col items-center justify-center w-full h-full text-center">
            <h1 className="text-3xl font-bold mb-2 text-amana-primary-500">Create Account</h1>
            <span className="text-xs text-amana-neutral-400 mb-6">Register your AMANA account</span>

            <input type="text" placeholder="Name" className="w-full bg-amana-neutral-100 text-amana-neutral-500 border border-amana-neutral-200 my-2 p-3 text-sm rounded-xl outline-none focus:border-amana-primary-500 focus:ring-2 focus:ring-amana-primary-500/15 transition-all" />
            <input type="email" placeholder="Enter E-mail" className="w-full bg-amana-neutral-100 text-amana-neutral-500 border border-amana-neutral-200 my-2 p-3 text-sm rounded-xl outline-none focus:border-amana-primary-500 focus:ring-2 focus:ring-amana-primary-500/15 transition-all" />
            <input type="password" placeholder="Enter Password" className="w-full bg-amana-neutral-100 text-amana-neutral-500 border border-amana-neutral-200 my-2 p-3 text-sm rounded-xl outline-none focus:border-amana-primary-500 focus:ring-2 focus:ring-amana-primary-500/15 transition-all" />

            <Button type="button" variant="primary" size="lg" className="text-xs px-11 rounded-xl uppercase tracking-wider mt-6 shadow-md">
              Sign Up
            </Button>
          </form>
        </div>

        <div className={`absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out flex items-center justify-center px-10 bg-white/95 backdrop-blur-sm ${isRightPanelActive ? 'translate-x-full opacity-0 z-10 pointer-events-none' : 'z-20 opacity-100'}`}>
          <form className="flex flex-col items-center justify-center w-full h-full text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/AMANA_Logo.png" className="h-10 mb-4 object-contain" alt="Amana Logo" />
            <h1 className="text-3xl font-bold mb-2 text-amana-primary-500">Sign In</h1>
            <span className="text-xs text-amana-neutral-400 mb-6">Sign in with Email & Password</span>

            <input type="email" placeholder="Enter E-mail" className="w-full bg-amana-neutral-100 text-amana-neutral-500 border border-amana-neutral-200 my-2 p-3 text-sm rounded-xl outline-none focus:border-amana-primary-500 focus:ring-2 focus:ring-amana-primary-500/15 transition-all" />
            <input type="password" placeholder="Enter Password" className="w-full bg-amana-neutral-100 text-amana-neutral-500 border border-amana-neutral-200 my-2 p-3 text-sm rounded-xl outline-none focus:border-amana-primary-500 focus:ring-2 focus:ring-amana-primary-500/15 transition-all" />

            <button type="button" className="text-amana-primary-500 text-xs mt-3 mb-4 hover:underline font-medium bg-transparent border-none cursor-pointer">Forget Password?</button>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => router.push('/user/profile')}
              className="text-xs px-11 rounded-xl uppercase tracking-wider shadow-md"
            >
              Sign In
            </Button>
          </form>
        </div>

        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-[100] ${isRightPanelActive ? '-translate-x-full' : ''}`}>
          <div className={`bg-gradient-to-br from-amana-primary-500 to-amana-danger-500 relative -left-full h-full w-[200%] transition-transform duration-700 ease-in-out text-amana-neutral-100 ${isRightPanelActive ? 'translate-x-1/2' : 'translate-x-0'}`}>
            <div className={`absolute w-1/2 h-full flex flex-col items-center justify-center px-10 text-center top-0 transition-transform duration-700 ease-in-out ${isRightPanelActive ? 'translate-x-0' : '-translate-x-[200%]'}`}>
              <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
              <p className="text-sm leading-relaxed mb-8 px-2 font-light text-amana-neutral-100/80">To keep connected with AMANA, please login with your personal info</p>
              <OutlineButton
                onClick={() => setIsRightPanelActive(false)}
                className="border-2 border-amana-neutral-100 bg-transparent text-amana-neutral-100 hover:bg-amana-neutral-100 hover:text-amana-primary-500 text-xs px-11 rounded-xl uppercase tracking-wider"
              >
                Sign In
              </OutlineButton>
            </div>
            <div className={`absolute right-0 w-1/2 h-full flex flex-col items-center justify-center px-10 text-center top-0 transition-transform duration-700 ease-in-out ${isRightPanelActive ? 'translate-x-[200%]' : 'translate-x-0'}`}>
              <h1 className="text-3xl font-bold mb-4">Hello, Talent!</h1>
              <p className="text-sm leading-relaxed mb-8 px-2 font-light text-amana-neutral-100/80">Enter your personal details and start your journey with AMANA Core Administrative System</p>
              <OutlineButton
                onClick={() => setIsRightPanelActive(true)}
                className="border-2 border-amana-neutral-100 bg-transparent text-amana-neutral-100 hover:bg-amana-neutral-100 hover:text-amana-primary-500 text-xs px-11 rounded-xl uppercase tracking-wider"
              >
                Sign Up
              </OutlineButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
