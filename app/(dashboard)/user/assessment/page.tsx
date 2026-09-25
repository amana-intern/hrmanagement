'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SectionCard from '@/app/components/layout/SectionCard';
import Button from '@/app/components/forms/Button';
import StatusModal from '@/app/components/feedback/StatusModal';
import { CardStackSkeleton } from '@/app/components/feedback/PageSkeleton';

interface AsmOption {
  idOpsi: string;
  teks: string | null;
}

interface AsmQuestion {
  idPertanyaan: string;
  teks: string;
  tipeSoal: string | null;
  gridId?: string | null;
  options: AsmOption[];
}

type RenderItem =
  | { kind: 'question'; q: AsmQuestion }
  | { kind: 'grid'; gridId: string; columns: AsmOption[]; rows: AsmQuestion[] };

function groupRenderItems(questions: AsmQuestion[]): RenderItem[] {
  const items: RenderItem[] = [];
  for (const q of questions) {
    if (q.tipeSoal === 'checkbox_grid' && q.gridId) {
      const last = items[items.length - 1];
      if (last?.kind === 'grid' && last.gridId === q.gridId) {
        last.rows.push(q);
        continue;
      }
      items.push({ kind: 'grid', gridId: q.gridId, columns: q.options, rows: [q] });
      continue;
    }
    items.push({ kind: 'question', q });
  }
  return items;
}

interface AsmCategory {
  idKategoriAsm: string;
  namaKategori: string;
  questions: AsmQuestion[];
}

interface OpenAssessment {
  idAssessment: string;
  judul: string;
  deskripsi: string | null;
  categories: AsmCategory[];
}

type AnswerValue = { pilihan?: string[]; jawabanTeks?: string };

export default function AssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [openAssessment, setOpenAssessment] = useState<OpenAssessment | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const isFirstScroll = useRef(true);

  useEffect(() => {
    if (isFirstScroll.current) {
      isFirstScroll.current = false;
      return;
    }
    if (!openAssessment || !topRef.current) return;

    // 1) Reset semua kontainer scroll LELUHUR (main PageLayout, dll).
    let el: HTMLElement | null = topRef.current.parentElement;
    while (el) {
      const style = getComputedStyle(el);
      if (/(auto|scroll)/.test(style.overflowY)) el.scrollTop = 0;
      el = el.parentElement;
    }

    // 2) Reset semua kontainer scroll KETURUNAN dalam topRef (daftar pertanyaan).
    topRef.current.querySelectorAll<HTMLElement>('*').forEach((n) => {
      const style = getComputedStyle(n);
      if (/(auto|scroll)/.test(style.overflowY)) n.scrollTop = 0;
    });
  }, [step, openAssessment]);

  useEffect(() => {
    (async () => {
      try {
        const open = await fetch('/api/assessments/open', { cache: 'no-store' });
        if (open.ok) {
          const d = await open.json();
          setOpenAssessment(d.assessment);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const clearAnswer = (idPertanyaan: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[idPertanyaan];
      return next;
    });
  };

  const toggleChoice = (q: AsmQuestion, idOpsi: string) => {
    setAnswers((prev) => {
      if (q.tipeSoal === 'checkbox' || q.tipeSoal === 'checkbox_grid') {
        const current = prev[q.idPertanyaan]?.pilihan ?? [];
        const next = current.includes(idOpsi) ? current.filter((id) => id !== idOpsi) : [...current, idOpsi];
        return { ...prev, [q.idPertanyaan]: { pilihan: next } };
      }
      return { ...prev, [q.idPertanyaan]: { pilihan: [idOpsi] } };
    });
  };

  const handleSubmit = async () => {
    if (!openAssessment) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/assessments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idAssessment: openAssessment.idAssessment,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save assessment result');
      // Refresh server components (DashboardLayout ikut dihitung ulang)
      // supaya gerbang assessment terbuka segera setelah tersimpan.
      router.refresh();
      setSubmitSuccess(true);
    } catch (err) {
      setStatus({ ok: false, text: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  // Setelah submit sukses: tampilkan konfirmasi singkat lalu otomatis ke profile.
  useEffect(() => {
    if (!submitSuccess) return;
    const t = setTimeout(() => router.push('/user/profile'), 2000);
    return () => clearTimeout(t);
  }, [submitSuccess, router]);

  if (loading) return <CardStackSkeleton blocks={2} />;

  if (submitSuccess) {
    return (
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting />
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="w-full max-w-xl bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-8 py-10 flex flex-col items-center text-center gap-4">
            <span className="w-16 h-16 rounded-full bg-amana-success-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-amana-success-500" />
            </span>
            <h2 className="text-[22px] font-semibold text-amana-primary-500">
              Assessment submitted successfully
            </h2>
            <p className="text-[15px] text-amana-neutral-400 leading-relaxed">
              Thank you for completing the competency assessment.
              Your answers have been saved and all pages are now unlocked.
            </p>
            <p className="text-[14px] font-medium text-amana-primary-500 animate-pulse">
              Redirecting to your profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!openAssessment) {
    return (
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting />
        <SectionCard className="text-center">
          <p className="font-semibold text-amana-primary-500 text-[20px] mb-2">Belum ada assessment</p>
          <p className="text-[14px] text-amana-neutral-400 mb-6">HR has not opened any assessment yet.</p>
          <div className="flex justify-center">
            <Button variant="primary" size="lg" onClick={() => router.push('/user/careerhub')}>
              Back to Career Hub
            </Button>
          </div>
        </SectionCard>
      </div>
    );
  }

  const totalSteps = openAssessment.categories.length;
  const lastStep = totalSteps - 1;
  const cat = openAssessment.categories[step];

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting />

      <div ref={topRef} className="flex-1 min-h-0 flex flex-col gap-3">
        <SectionCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-semibold text-amana-primary-500 leading-tight">{openAssessment.judul}</h2>
              <p className="text-[14px] text-amana-neutral-400 mt-1">
                {openAssessment.deskripsi || 'Answer each question below. Questions may be skipped.'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[13px] font-semibold text-amana-primary-500">Field {step + 1} of {totalSteps}</p>
              <div className="flex gap-1 mt-1 justify-end">
                {[...Array(totalSteps)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setStep(i)}
                    aria-label={`Go to field ${i + 1} of ${totalSteps}`}
                    className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${i === step ? 'bg-amana-primary-500' : i < step ? 'bg-amana-primary-300' : 'bg-amana-neutral-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard scroll className="flex-1">
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth pr-1">
            <div key={cat.idKategoriAsm}>
                <p className="text-[16px] font-semibold text-amana-primary-500 mb-3">{cat.namaKategori}</p>
                <div className="flex flex-col gap-3">
                  {groupRenderItems(cat.questions).map((item) =>
                    item.kind === 'grid' ? (
                      <div key={item.gridId} className="p-3 rounded-[8px] bg-amana-neutral-100 border border-amana-primary-500">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-[14px]">
                            <thead>
                              <tr>
                                <th className="text-left p-2" />
                                {item.columns.map((col) => (
                                  <th
                                    key={col.idOpsi}
                                    className="p-2 text-[13px] font-semibold text-amana-neutral-500 text-center border-b border-amana-neutral-300"
                                  >
                                    {col.teks}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {item.rows.map((row) => (
                                <tr key={row.idPertanyaan} className="border-b border-amana-neutral-300 last:border-b-0">
                                  <td className="p-2 text-[15px] font-semibold text-amana-neutral-500 whitespace-nowrap">{row.teks}</td>
                                  {item.columns.map((col, colIndex) => {
                                    // Each row has its own duplicated copy of the shared columns (same text,
                                    // different idOpsi) — must toggle/check the row's own option, not item.columns[*].
                                    const rowOption = row.options[colIndex];
                                    return (
                                      <td key={col.idOpsi} className="p-2 text-center">
                                        {rowOption && (
                                          <input
                                            type="checkbox"
                                            checked={(answers[row.idPertanyaan]?.pilihan ?? []).includes(rowOption.idOpsi)}
                                            onChange={() => toggleChoice(row, rowOption.idOpsi)}
                                            className="accent-amana-primary-500 w-4 h-4"
                                          />
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <button
                          onClick={() => item.rows.forEach((row) => clearAnswer(row.idPertanyaan))}
                          className="text-[13px] text-amana-neutral-400 hover:text-amana-primary-500 bg-transparent border-none cursor-pointer block ml-auto mt-2"
                        >
                          Delete answers on this grid
                        </button>
                      </div>
                    ) : (
                      (() => {
                        const q = item.q;
                        return (
                    <div key={q.idPertanyaan} className="p-3 rounded-[8px] bg-amana-neutral-100 border border-amana-primary-500">
                      <p className="text-[15px] font-semibold text-amana-neutral-500 mb-2">{q.teks}</p>
                      <div className="flex flex-col gap-1">
                        {q.tipeSoal === 'short_answer' ? (
                          <textarea
                            value={answers[q.idPertanyaan]?.jawabanTeks ?? ''}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.idPertanyaan]: { jawabanTeks: e.target.value } }))}
                            rows={2}
                            placeholder="Your answer"
                            className="w-full border border-amana-neutral-300 rounded-[8px] px-3 py-2 text-[14px] text-amana-neutral-500 placeholder:text-amana-neutral-300 bg-amana-neutral-100 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
                          />
                        ) : (
                          q.options.map((o) => {
                            const active =
                              q.tipeSoal === 'checkbox'
                                ? (answers[q.idPertanyaan]?.pilihan ?? []).includes(o.idOpsi)
                                : answers[q.idPertanyaan]?.pilihan?.[0] === o.idOpsi;
                            return (
                              <label
                                key={o.idOpsi}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${
                                  active ? 'border-amana-primary-500 bg-amana-primary-100' : 'border-amana-neutral-300 bg-amana-neutral-100 hover:border-amana-primary-300'
                                }`}
                              >
                                <input
                                  type={q.tipeSoal === 'checkbox' ? 'checkbox' : 'radio'}
                                  name={q.tipeSoal === 'checkbox' ? undefined : q.idPertanyaan}
                                  checked={active}
                                  onChange={() => toggleChoice(q, o.idOpsi)}
                                  className="accent-amana-primary-500"
                                />
                                <span className="text-[14px] text-amana-neutral-500">{o.teks}</span>
                              </label>
                            );
                          })
                        )}
                        <button
                          onClick={() => clearAnswer(q.idPertanyaan)}
                          className="text-[13px] text-amana-neutral-400 hover:text-amana-primary-500 bg-transparent border-none cursor-pointer self-end"
                        >
                          Remove Answer
                        </button>
                      </div>
                    </div>
                        );
                      })()
                    )
                  )}
                </div>
              </div>
          </div>

          <div className="flex-shrink-0 flex items-center justify-between gap-3 mt-4 pt-4 border-t border-amana-neutral-200">
            <div>
              {step > 0 && (
                <Button variant="outline" size="lg" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              {step < lastStep ? (
                <Button variant="primary" size="lg" onClick={() => setStep((s) => s + 1)}>
                  Next
                </Button>
              ) : (
                <Button variant="primary" size="lg" disabled={submitting} isLoading={submitting} onClick={handleSubmit}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <StatusModal state={status} onClose={() => setStatus(null)} />
    </div>
  );
}