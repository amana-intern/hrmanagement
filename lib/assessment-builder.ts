import { ASSESSMENT_QUESTION_TYPES } from './constants';

interface FlatQuestion {
  teks: string;
  tipeSoal: string | null;
  gridId: string | null;
  options: unknown;
}

// Expands one input question into 1 (normal) or N (checkbox_grid — one per row, sharing a gridId
// and each carrying its own duplicated copy of the grid's shared column options) flat questions.
function flattenQuestion(q: any, ci: number, i: number): FlatQuestion[] {
  if (q?.tipeSoal === ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID) {
    const rows = Array.isArray(q.rows) ? (q.rows as any[]).filter((r) => r?.teks) : [];
    if (rows.length === 0) return [];
    const gridId = `ASG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${ci}-${i}`;
    return rows.map((r: any) => ({
      teks: String(r.teks),
      tipeSoal: ASSESSMENT_QUESTION_TYPES.CHECKBOX_GRID,
      gridId,
      options: q.options,
    }));
  }
  if (!q?.teks) return [];
  return [{ teks: String(q.teks), tipeSoal: q.tipeSoal ? String(q.tipeSoal) : null, gridId: null, options: q.options }];
}

// Shared category/question/option payload builder for assessment create & edit.
export function buildCategoriesCreateInput(categories: unknown) {
  return Array.isArray(categories)
    ? categories
        .filter((c: any) => c?.namaKategori)
        .map((c: any, ci: number) => {
          const flattened = Array.isArray(c.questions)
            ? (c.questions as any[]).flatMap((q, i) => flattenQuestion(q, ci, i))
            : [];
          return {
            idKategoriAsm: `ASC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${ci}`,
            namaKategori: String(c.namaKategori),
            urutan: ci + 1,
            questions: {
              create: flattened.map((q, qi) => ({
                idPertanyaan: `ASQ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${ci}-${qi}`,
                teks: q.teks,
                urutan: qi + 1,
                tipeSoal: q.tipeSoal,
                gridId: q.gridId,
                options: {
                  create: Array.isArray(q.options)
                    ? (q.options as any[])
                        .filter((o: any) => o?.teks)
                        .map((o: any, oi: number) => ({
                          idOpsi: `ASO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${ci}-${qi}-${oi}`,
                          teks: String(o.teks),
                          urutan: oi + 1,
                        }))
                    : [],
                },
              })),
            },
          };
        })
    : [];
}
