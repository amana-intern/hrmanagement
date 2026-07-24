'use client';

import { useRouter } from 'next/navigation';
import { Input, Button } from '../forms';

export function SignUpForm() {
  return (
    <form className="flex flex-col items-center justify-center w-full h-full text-center px-10">
      <h1 className="text-3xl font-semibold mb-2 text-amana-blue">Create Account</h1>
      <span className="text-xs text-amana-sec-7 mb-6">Register your AMANA account</span>

      <div className="w-full flex flex-col gap-3 my-2">
        <Input type="text" placeholder="Name" />
        <Input type="email" placeholder="Enter E-mail" />
        <Input type="password" placeholder="Enter Password" />
      </div>

      <Button type="button" className="mt-6 uppercase tracking-wider py-3 px-11">
        Sign Up
      </Button>
    </form>
  );
}

export function SignInForm() {
  const router = useRouter();

  return (
    <form className="flex flex-col items-center justify-center w-full h-full text-center px-10">
      <img src="/AMANA_Logo.png" className="h-10 mb-4 object-contain" alt="Amana Logo" />
      <h1 className="text-3xl font-semibold mb-2 text-amana-blue">Sign In</h1>
      <span className="text-xs text-amana-sec-7 mb-6">Sign in with Email & Password</span>

      <div className="w-full flex flex-col gap-3 my-2">
        <Input type="email" placeholder="Enter E-mail" />
        <Input type="password" placeholder="Enter Password" />
      </div>

      <button type="button" className="text-amana-blue text-xs mt-3 mb-4 hover:underline font-semibold bg-transparent border-none cursor-pointer">
        Forget Password?
      </button>

      <Button
        type="button"
        onClick={() => router.push('/user/profile')}
        className="uppercase tracking-wider py-3 px-11"
      >
        Sign In
      </Button>
    </form>
  );
}

interface AuthOverlayProps {
  isRightPanelActive: boolean;
  onToggle: (active: boolean) => void;
}

export function AuthOverlay({ isRightPanelActive, onToggle }: AuthOverlayProps) {
  return (
    <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-[100] ${isRightPanelActive ? '-translate-x-full' : ''}`}>
      <div className={`bg-gradient-to-br from-amana-blue to-amana-sec-5 relative -left-full h-full w-[200%] transition-transform duration-700 ease-in-out text-amana-white ${isRightPanelActive ? 'translate-x-1/2' : 'translate-x-0'}`}>
        
        {/* Left Overlay */}
        <div className={`absolute w-1/2 h-full flex flex-col items-center justify-center px-10 text-center top-0 transition-transform duration-700 ease-in-out ${isRightPanelActive ? 'translate-x-0' : '-translate-x-[200%]'}`}>
          <h1 className="text-3xl font-semibold mb-4">Welcome Back!</h1>
          <p className="text-sm leading-relaxed mb-8 px-2 font-light text-amana-white/80">To keep connected with AMANA, please login with your personal info</p>
          <button 
            type="button" 
            onClick={() => onToggle(false)} 
            className="bg-transparent border-2 border-amana-white text-amana-white text-xs font-semibold py-3 px-11 rounded-xl uppercase tracking-wider hover:bg-amana-white hover:text-amana-blue transition-all duration-200"
          >
            Sign In
          </button>
        </div>

        {/* Right Overlay */}
        <div className={`absolute right-0 w-1/2 h-full flex flex-col items-center justify-center px-10 text-center top-0 transition-transform duration-700 ease-in-out ${isRightPanelActive ? 'translate-x-[200%]' : 'translate-x-0'}`}>
          <h1 className="text-3xl font-semibold mb-4">Hello, Talent!</h1>
          <p className="text-sm leading-relaxed mb-8 px-2 font-light text-amana-white/80">Enter your personal details and start your journey with AMANA Core Administrative System</p>
          <button 
            type="button" 
            onClick={() => onToggle(true)} 
            className="bg-transparent border-2 border-amana-white text-amana-white text-xs font-semibold py-3 px-11 rounded-xl uppercase tracking-wider hover:bg-amana-white hover:text-amana-blue transition-all duration-200"
          >
            Sign Up
          </button>
        </div>

      </div>
    </div>
  );
}
