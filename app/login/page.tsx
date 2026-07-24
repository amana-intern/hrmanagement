'use client';

import { useState } from 'react';
import { SignInForm, SignUpForm, AuthOverlay } from '../components/auth';

export default function LoginPage() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);

  return (
    <div className="min-h-screen bg-[url('/backlogin.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 font-sans relative">
      <div className="absolute inset-0 bg-black/40 z-0 backdrop-blur-[2px]" />

      <div className="relative z-10 overflow-hidden w-full max-w-[768px] min-h-[480px] bg-white/95 backdrop-blur-sm rounded-[30px] shadow-2xl animate-scale-in">

        <div className={`absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out flex items-center justify-center bg-white/95 backdrop-blur-sm ${isRightPanelActive ? 'translate-x-full opacity-100 z-50' : 'opacity-0 z-10 pointer-events-none'}`}>
          <SignUpForm />
        </div>

        <div className={`absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out flex items-center justify-center bg-white/95 backdrop-blur-sm ${isRightPanelActive ? 'translate-x-full opacity-0 z-10 pointer-events-none' : 'z-20 opacity-100'}`}>
          <SignInForm />
        </div>

        <AuthOverlay 
          isRightPanelActive={isRightPanelActive} 
          onToggle={setIsRightPanelActive} 
        />
      </div>
    </div>
  );
}

