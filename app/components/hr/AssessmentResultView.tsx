'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/app/utils/cn';

// A plain, fixed-size tab button — unlike ToggleButton, it has no width-animating selection
// indicator, so a row of many long-label tabs never reflows/resizes itself on click or hover.
function CategoryTab({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 min-w-0 whitespace-normal text-center px-2 py-1.5 text-[13px] leading-[1.15] font-semibold rounded-[8px] border transition-colors duration-150',
        selected
          ? 'bg-amana-neutral-100 text-amana-primary-500 border-amana-primary-500'
          : 'bg-amana-primary-500 text-amana-neutral-100 border-transparent hover:bg-amana-primary-100 hover:text-amana-primary-500'
      )}
    >
      {children}
    </button>
  );
}

export interface AssessmentResultOption {
  idOpsi: string;
  teks: string | null;
}

export interface AssessmentResultQuestion {
  idPertanyaan: string;
  teks: string;
  tipeSoal?: string | null;
  options?: AssessmentResultOption[];
}

export interface AssessmentResultField {
  idKategoriAsm: string;
  namaKategori: string;
  questions?: AssessmentResultQuestion[];
}

export interface AssessmentResultAnswer {
  pilihan?: string[] | null;
  jawabanTeks?: string | null;
}

export interface AssessmentResultData {
  answers?: Record<string, AssessmentResultAnswer>;
}

interface AssessmentResultViewProps {
  categories: AssessmentResultField[];
  assessment: AssessmentResultData | null;
}

function isAnswered(q: AssessmentResultQuestion, answer: AssessmentResultAnswer | undefined) {
  return q.tipeSoal === 'short_answer' ? !!answer?.jawabanTeks : !!answer?.pilihan?.length;
}

export default function AssessmentResultView({ categories, assessment }: AssessmentResultViewProps) {
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const fields = useMemo(
    () =>
      categories.map((c) => {
        const questions = c.questions ?? [];
        const answered = questions.filter((q) => isAnswered(q, assessment?.answers?.[q.idPertanyaan])).length;
        return { id: c.idKategoriAsm, field: c.namaKategori, total: questions.length, answered };
      }),
    [categories, assessment]
  );

  const selectedCategory = useMemo(
    () => (selectedField ? (categories.find((c) => c.namaKategori === selectedField) ?? null) : null),
    [categories, selectedField]
  );

  if (!assessment) {
    return <p className="text-sm text-amana-neutral-400">No assessment data yet.</p>;
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth flex flex-col gap-4 pr-1">
      <div className="bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
        <div className="flex flex-nowrap gap-2">
          <CategoryTab selected={selectedField === null} onClick={() => setSelectedField(null)}>
            All Fields
          </CategoryTab>
          {fields.map(({ field }) => (
            <CategoryTab key={field} selected={selectedField === field} onClick={() => setSelectedField(field)}>
              {field}
            </CategoryTab>
          ))}
        </div>
      </div>

      {selectedCategory ? (
        <div className="bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
          <h4 className="text-[18px] font-sans font-semibold not-italic text-amana-primary-500 pb-1.5 mb-2 border-b border-amana-primary-500">
            {selectedCategory.namaKategori}
          </h4>
          <div className="flex flex-col divide-y divide-amana-neutral-200">
            {selectedCategory.questions && selectedCategory.questions.length > 0 ? (
              selectedCategory.questions.map((q) => {
                const answer = assessment.answers?.[q.idPertanyaan];
                const optionLabel = (idOpsi: string) => q.options?.find((o) => o.idOpsi === idOpsi)?.teks ?? idOpsi;
                const answered = isAnswered(q, answer);

                let content: React.ReactNode = '-';
                if (q.tipeSoal === 'short_answer') {
                  content = answer?.jawabanTeks || '-';
                } else if (answer?.pilihan?.length) {
                  content = answer.pilihan.map(optionLabel).join(', ');
                }

                return (
                  <div key={q.idPertanyaan} className="min-h-[42px] flex items-center justify-between gap-3 py-1">
                    <span className="text-[15px] text-amana-neutral-500">{q.teks}</span>
                    <span
                      className={cn(
                        'flex-shrink-0 max-w-[280px] truncate rounded-full px-4 py-1 text-[14px] font-semibold',
                        answered ? 'bg-amana-success-500 text-amana-neutral-100' : 'bg-amana-neutral-300 text-amana-neutral-500'
                      )}
                    >
                      {content}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-[14px] text-amana-neutral-400 py-1.5">Tidak ada kompetensi pada bidang ini.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fields.map(({ id, field, total, answered }) => {
            const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedField(field)}
                className="text-left p-3 rounded-[5px] bg-amana-neutral-200/40 border border-amana-neutral-300 hover:border-amana-primary-500 transition-colors duration-150"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[15px] font-semibold text-amana-neutral-500">{field}</span>
                  <span className="flex-shrink-0 text-[13px] font-semibold text-amana-primary-500">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-amana-neutral-300 overflow-hidden mb-1.5">
                  <div className="h-full rounded-full bg-amana-success-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[13px] text-amana-neutral-400">{answered} of {total} answered</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
