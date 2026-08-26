// POST /api/auth/forgot-password — dinonaktifkan sementara demi keamanan.
// Reset password hanya bisa dilakukan oleh Admin HR. Jadwal: digantikan Google OAuth.
export async function POST() {
  return Response.json({ error: 'Service unavailable. Contact Admin HR.' }, { status: 403 });
}