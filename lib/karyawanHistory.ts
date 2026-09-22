import type { KaryawanHistory } from '@prisma/client';

export interface CareerHistoryChange {
  field: string;
  from: string;
  to: string;
}

export interface CareerHistoryEntry {
  id: string;
  aktor: string | null;
  waktu: Date | null;
  changes: CareerHistoryChange[];
}

// Baris KaryawanHistory yang dibuat dalam satu aksi edit yang sama (satu createMany,
// jadi aktor + createdAt identik) digabung jadi satu entry dengan beberapa changes,
// supaya tampil sebagai satu baris di Career History alih-alih satu baris per field.
export function groupKaryawanHistory(rows: KaryawanHistory[]): CareerHistoryEntry[] {
  const groups = new Map<string, CareerHistoryEntry>();
  for (const h of rows) {
    const key = `${h.diubahOleh ?? ''}|${h.createdAt?.getTime() ?? ''}`;
    let entry = groups.get(key);
    if (!entry) {
      entry = { id: h.idHistory, aktor: h.diubahOleh, waktu: h.createdAt, changes: [] };
      groups.set(key, entry);
    }
    entry.changes.push({ field: h.tipe ?? '-', from: h.nilaiLama ?? '-', to: h.nilaiBaru ?? '-' });
  }
  return Array.from(groups.values());
}
