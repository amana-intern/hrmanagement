'use client';

import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[url('/backlogin.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 font-sans relative">
      <div className="absolute inset-0 bg-black/40 z-0 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-sm rounded-[30px] shadow-2xl animate-scale-in px-10 py-12 text-center">
        <img src="/AMANA_Logo.png" className="h-10 mb-4 mx-auto object-contain" alt="Amana Logo" />
        <h1 className="text-3xl font-bold mb-2 text-amana-primary-500">Forget Password</h1>
        <p className="text-xs text-amana-neutral-400 mb-6">
          Automatic password reset is not yet available.
        </p>
        <div className="px-5 py-4 rounded-xl bg-amana-primary-500/10 border border-amana-neutral-200 text-sm text-amana-neutral-500">
          Please contact the <span className="font-semibold text-amana-primary-500">Admin HR</span> to
          reset your account password.
        </div>

        <button
          type="button"
          onClick={() => router.push('/login')}
          className="bg-amana-primary-500 text-amana-neutral-100 text-xs font-bold py-3 px-11 rounded-xl uppercase tracking-wider mt-6 hover:shadow-lg hover:shadow-amana-primary-500/30 hover:-translate-y-0.5 transition-all duration-200 shadow-md"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}