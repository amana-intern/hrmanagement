import { isDemoMode } from '@/lib/auth-mode';
import LoginForm from './LoginForm';

// Baca DEMO_MODE saat request, bukan dibekukan saat build.
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <LoginForm demoMode={isDemoMode()} />;
}
