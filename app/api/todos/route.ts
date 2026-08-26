import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

// GET /api/todos — to-do list milik user yang sedang login (semua role).
// To-do yang sudah selesai (done) lebih dari 7 hari tidak lagi ditampilkan,
// dan yang done selalu disortir ke paling bawah.
// POST /api/todos — tambah to-do baru.
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ error: 'Employee data not found' }, { status: 403 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const list = await prisma.hrTodo.findMany({
      where: {
        idKaryawan: auth.idKaryawan,
        OR: [{ done: false }, { doneAt: { gte: sevenDaysAgo } }],
      },
      take: 100,
    });

    const sorted = list
      .filter((t) => !t.done || (t.doneAt && t.doneAt >= sevenDaysAgo))
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        const at = (t: (typeof list)[number]) => (t.done ? t.doneAt?.getTime() ?? 0 : t.createdAt?.getTime() ?? 0);
        return at(b) - at(a);
      });

    return Response.json({
      list: sorted.map((t) => ({
        idTodo: t.idTodo,
        teks: t.teks,
        done: t.done,
        doneAt: t.doneAt ? t.doneAt.toISOString() : null,
      })),
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ error: 'Employee data not found' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const teks = (body?.teks ?? '').toString().trim();
    if (!teks) {
      return Response.json({ error: 'To-do text cannot be empty' }, { status: 400 });
    }

    const todo = await prisma.hrTodo.create({
      data: {
        idTodo: `TODO-${Date.now()}`,
        idKaryawan: auth.idKaryawan,
        teks,
      },
    });

    return Response.json({ idTodo: todo.idTodo, teks: todo.teks }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}