import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { ROLES, ROLE_ROUTES, type Role } from '@/lib/roles';

const publicRoutes = ['/login'];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Izinkan aset statis publik (/_next, favicon, icon) langsung — KECUALI /uploads
  if (path !== '/uploads' && (path.startsWith('/_next') || (path.includes('.') && !path.startsWith('/uploads')))) {
    return NextResponse.next();
  }

  const session = await decrypt(req.cookies.get('session')?.value);

  // Route publik -> jika sudah login, arahkan ke home role masing-masing
  if (publicRoutes.includes(path)) {
    if (session?.idRole) {
      const home = roleHome(session.idRole as Role) ?? '/user/profile';
      return NextResponse.redirect(new URL(home, req.nextUrl));
    }
    return NextResponse.next();
  }

  const isApi = path.startsWith('/api');
  if (isApi) return NextResponse.next();

  // Belum login -> lempar ke /login (termasuk akses file /uploads/*)
  if (!session?.idRole) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // File upload: boleh diakses siapa saja yang sudah login
  if (path.startsWith('/uploads')) {
    return NextResponse.next();
  }

  // Cek otorisasi route group sesuai role
  const role = session.idRole as Role;
  const allowed = ROLE_ROUTES[role] ?? ROLE_ROUTES[ROLES.EMPLOYEE];
  const canAccess = allowed.some((prefix) => path.startsWith(prefix));

  if (!canAccess) {
    const home = roleHome(session.idRole as Role) ?? '/user/profile';
    return NextResponse.redirect(new URL(home, req.nextUrl));
  }

  return NextResponse.next();
}

function roleHome(role: Role): string | null {
  switch (role) {
    case ROLES.EMPLOYEE:
      return '/user/profile';
    case ROLES.PARTNER:
      return '/partner/profile';
    case ROLES.ADMIN_HR:
      return '/hr/profile';
    case ROLES.ADMIN_OPS:
      return '/ops/profile';
    default:
      return null;
  }
}

export const config = {
  matcher: [
    '/uploads/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)',
  ],
};
