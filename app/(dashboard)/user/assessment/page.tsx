'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SectionCard from '@/app/components/layout/SectionCard';
import Button from '@/app/components/forms/Button';
import StatusModal, { StatusState } from '@/app/components/feedback/StatusModal';
import TextAreaField from '@/app/components/forms/TextAreaField';
import { ASSESSMENT_LEVELS } from '@/lib/assessment-template';
import { CardStackSkeleton } from '@/app/components/feedback/PageSkeleton';

interface AsmOption {
  idOpsi: string;
  teks: string | null;
}

interface AsmQuestion {
  idPertanyaan: string;
  teks: string;
  tipeSoal: string | null;
  options: AsmOption[];
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

type AnswerValue = { level?: number; pilihan?: string[]; jawabanTeks?: string };

export default function AssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [openAssessment, setOpenAssessment] = useState<OpenAssessment | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [technicalSkills, setTechnicalSkills] = useState('');
  const [selfDevelopmentAreas, setSelfDevelopmentAreas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<StatusState | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const isFirstScroll = useRef(true);

  useEffect(() => {
    if (isFirstScroll.current) {
      isFirstScroll.current = false;
      return;
    }
    if (!openAssessment) return;
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const isSelfAssessmentComplete = technicalSkills.trim() !== '' && selfDevelopmentAreas.trim() !== '';

  const clearAnswer = (idPertanyaan: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[idPertanyaan];
      return next;
    });
  };

  const toggleChoice = (q: AsmQuestion, idOpsi: string) => {
    setAnswers((prev) => {
      if (q.tipeSoal === 'checkbox') {
        const current = prev[q.idPertanyaan]?.pilihan ?? [];
        const next = current.includes(idOpsi) ? current.filter((id) => id !== idOpsi) : [...current, idOpsi];
        return { ...prev, [q.idPertanyaan]: { pilihan: next } };
      }
      return { ...prev, [q.idPertanyaan]: { pilihan: [idOpsi] } };
    });
  };

  const handleSubmit = async () => {
    if (!openAssessment || !isSelfAssessmentComplete) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/assessments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idAssessment: openAssessment.idAssessment,
          answers,
          technicalSkills,
          selfDevelopmentAreas,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save assessment result');
      router.push('/user/careerhub');
    } catch (err) {
      setStatus({ ok: false, text: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <CardStackSkeleton blocks={2} />;

  if (!openAssessment) {
    return (
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting />
        <SectionCard className="text-center">
          <p className="font-semibold text-amana-primary-500 text-[20px] mb-2">Belum ada assessment</p>
          <p className="text-[14px] text-amana-neutral-400 mb-6">HR belum membuka assessment saat ini.</p>
          <div className="flex justify-center">
            <Button variant="primary" size="lg" onClick={() => router.push('/user/careerhub')}>
              Kembali ke Career Hub
            </Button>
          </div>
        </SectionCard>
      </div>
    );
  }

  const totalSteps = openAssessment.categories.length + 1;
  const lastStep = totalSteps - 1;
  const cat = step < openAssessment.categories.length ? openAssessment.categories[step] : null;

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting />

      <div ref={topRef} className="flex-1 min-h-0 flex flex-col gap-3">
        <SectionCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-semibold text-amana-primary-500 leading-tight">{openAssessment.judul}</h2>
              <p className="text-[14px] text-amana-neutral-400 mt-1">
                {(openAssessment.deskripsi ?? '').trim() === 'Self assessment kompetensi seluruh karyawan.'
                  ? 'Self assessment of all employees.'
                  : (openAssessment.deskripsi ?? undefined) ??
                    'Pilih tingkat kemahiran untuk setiap kompetensi. Kompetensi boleh dilewati (tidak wajib diisi).'}
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
            {cat ? (
              <div key={cat.idKategoriAsm}>
                <p className="text-[16px] font-semibold text-amana-primary-500 mb-3">{cat.namaKategori}</p>
                <div className="flex flex-col gap-3">
                  {cat.questions.map((q) => (
                    <div key={q.idPertanyaan} className="p-3 rounded-[8px] bg-amana-neutral-100 border border-amana-primary-500">
                      <p className="text-[15px] font-semibold text-amana-neutral-500 mb-2">{q.teks}</p>
                      <div className="flex flex-col gap-1">
                        {!q.tipeSoal ? (
                          ASSESSMENT_LEVELS.map((lvl) => {
                            const active = answers[q.idPertanyaan]?.level === lvl.level;
                            return (
                              <label
                                key={lvl.level}
                                className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${
                                  active ? 'border-amana-primary-500 bg-amana-primary-100' : 'border-amana-neutral-300 bg-amana-neutral-100 hover:border-amana-primary-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={q.idPertanyaan}
                                  checked={active}
                                  onChange={() => setAnswers((prev) => ({ ...prev, [q.idPertanyaan]: { level: lvl.level } }))}
                                  className="mt-1 accent-amana-primary-500"
                                />
                                <span className="text-[14px]">
                                  <span className="font-semibold text-amana-neutral-500">Level {lvl.level} ({lvl.label})</span>
                                  <span className="block text-[13px] text-amana-neutral-400 mt-0.5">{lvl.description}</span>
                                </span>
                              </label>
                            );
                          })
                        ) : q.tipeSoal === 'short_answer' ? (
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
                          Delete answer on this competency
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[16px] font-semibold text-amana-primary-500 mb-3">Self Assessment & Need for development</p>
                <div className="flex flex-col gap-4">
                  <TextAreaField
                    label="Please list your 1-3 most significant technical skills"
                    value={technicalSkills}
                    onChange={setTechnicalSkills}
                    rows={3}
                    placeholder="e.g. Python, SQL, Project Management..."
                  />
                  <TextAreaField
                    label="Self-Development Areas"
                    value={selfDevelopmentAreas}
                    onChange={setSelfDevelopmentAreas}
                    rows={3}
                    placeholder="e.g. Leadership, Public Speaking, Time Management..."
                  />
                </div>
              </div>
            )}
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
                <Button variant="primary" size="lg" disabled={submitting || !isSelfAssessmentComplete} onClick={handleSubmit}>
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