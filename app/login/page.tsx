'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { ROLE_HOME } from '@/lib/roles';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const domain = process.env.NEXT_PUBLIC_CMP_EMAIL_DOMAIN ?? 'amana.id';
const googleReady = googleClientId.length > 0 && !googleClientId.includes('xxxx');

type LoginUser = {
  idRole?: string;
  needsAssessment?: boolean;
};

function resolveHome(user: LoginUser | undefined) {
  if (user?.needsAssessment) return '/user/assessment';
  return ROLE_HOME[(user?.idRole) as keyof typeof ROLE_HOME] ?? '/user/profile';
}

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      router.push(resolveHome(data.user));
    } catch {
      setError('Connection error');
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    const token = credentialResponse.credential;
    if (!token) {
      setError('Google token not found, please try again.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      router.push(resolveHome(data.user));
    } catch {
      setError('Connection error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('/backlogin.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 font-sans relative">
      <div className="absolute inset-0 bg-black/40 z-0 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-[420px] bg-white/95 backdrop-blur-sm rounded-[30px] shadow-2xl animate-scale-in px-10 py-12">
        <div className="flex flex-col">
          <div className="flex flex-col items-center text-center">
            <img src="/AMANA_Logo.png" className="h-10 mb-4 object-contain" alt="Amana Logo" />
            <h1 className="text-3xl font-bold mb-2 text-amana-primary-500">Sign In</h1>
            <span className="text-xs text-amana-neutral-400 mb-6">Enter your personal info</span>

            {error && <p className="text-xs text-red-500 mb-4">{error}</p>}
          </div>

          <form className="flex flex-col gap-3" onSubmit={handlePasswordSignIn}>
            <input
              type="email"
              placeholder="Enter E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-amana-neutral-100 text-amana-neutral-500 border border-amana-neutral-200 p-3 text-sm rounded-xl outline-none focus:border-amana-primary-500 focus:ring-2 focus:ring-amana-primary-500/15 transition-all"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-amana-neutral-100 text-amana-neutral-500 border border-amana-neutral-200 p-3 pr-11 text-sm rounded-xl outline-none focus:border-amana-primary-500 focus:ring-2 focus:ring-amana-primary-500/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-amana-neutral-400 hover:text-amana-primary-500 transition-colors cursor-pointer bg-transparent border-none"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-amana-primary-500 text-amana-neutral-100 text-xs font-bold py-3 rounded-xl uppercase tracking-wider hover:shadow-lg hover:shadow-amana-primary-500/30 hover:-translate-y-0.5 transition-all duration-200 shadow-md disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {googleReady ? (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-amana-neutral-200" />
                <span className="text-[11px] uppercase tracking-wider text-amana-neutral-400">or</span>
                <div className="flex-1 h-px bg-amana-neutral-200" />
              </div>

              <div className="w-full flex justify-center">
                <GoogleOAuthProvider clientId={googleClientId}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google login failed')}
                    hosted_domain={domain}
                  />
                </GoogleOAuthProvider>
              </div>
              <p className="text-[11px] text-amana-neutral-400 text-center mt-3">
                Use your @{domain} account to sign in.
              </p>
            </>
          ) : (
            <p className="text-[11px] text-amana-neutral-400 text-center mt-5">
              Google Sign-In will be active once configured by the administrator.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}