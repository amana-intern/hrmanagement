import { prisma } from '@/lib/prisma';

/** Tandai to-do selesai berdasarkan modul + idReferensi. */
export async function completeTodo(modul: string, idReferensi: string) {
  await prisma.hrTodo.updateMany({
    where: { modul, idReferensi, done: false },
    data: { done: true, doneAt: new Date() },
  });
}
