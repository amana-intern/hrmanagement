import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

// PATCH /api/todos/[idTodo] — tandai selesai / belum selesai (toggle done).
// DELETE /api/todos/[idTodo] — hapus to-do milik user yang login.
export async function PATCH(req: Request, ctx: { params: Promise<{ idTodo: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ error: 'Employee data not found' }, { status: 403 });
    }

    const { idTodo } = await ctx.params;
    const body = await req.json().catch(() => null);
    const done = body?.done === true;

    const existing = await prisma.hrTodo.findFirst({
      where: { idTodo, idKaryawan: auth.idKaryawan },
    });
    if (!existing) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.hrTodo.update({
      where: { idTodo },
      data: {
        done,
        doneAt: done ? new Date() : null,
      },
    });

    return Response.json({
      idTodo: updated.idTodo,
      teks: updated.teks,
      done: updated.done,
      doneAt: updated.doneAt ? updated.doneAt.toISOString() : null,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ idTodo: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ error: 'Employee data not found' }, { status: 403 });
    }

    const { idTodo } = await ctx.params;

    const existing = await prisma.hrTodo.findFirst({
      where: { idTodo, idKaryawan: auth.idKaryawan },
    });
    if (!existing) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.hrTodo.delete({ where: { idTodo } });
    return Response.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}